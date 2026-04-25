import 'dotenv/config';
import { Elysia, t } from "elysia";

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

function jaroWinkler(a: string, b: string): number {
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;
  const matchDist = Math.max(Math.floor(Math.max(a.length, b.length) / 2) - 1, 0);
  const aMatched = new Array(a.length).fill(false);
  const bMatched = new Array(b.length).fill(false);
  let matches = 0;
  for (let i = 0; i < a.length; i++) {
    const lo = Math.max(0, i - matchDist);
    const hi = Math.min(i + matchDist + 1, b.length);
    for (let j = lo; j < hi; j++) {
      if (bMatched[j] || a[i] !== b[j]) continue;
      aMatched[i] = bMatched[j] = true;
      matches++;
      break;
    }
  }
  if (!matches) return 0;
  let t = 0, k = 0;
  for (let i = 0; i < a.length; i++) {
    if (!aMatched[i]) continue;
    while (!bMatched[k]) k++;
    if (a[i] !== b[k]) t++;
    k++;
  }
  const jaro = (matches / a.length + matches / b.length + (matches - t / 2) / matches) / 3;
  let prefix = 0;
  for (let i = 0; i < Math.min(4, Math.min(a.length, b.length)); i++) {
    if (a[i] === b[i]) prefix++; else break;
  }
  return jaro + prefix * 0.1 * (1 - jaro);
}

function jaccardSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const setA = new Set(a.split(''));
  const setB = new Set(b.split(''));
  const intersection = [...setA].filter(c => setB.has(c)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 1 : intersection / union;
}

// Combined string distance (0 = identical, 1 = completely different)
// Averages normalised Levenshtein, Jaro-Winkler distance, and Jaccard distance.
function combinedStringDistance(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  const levDist = maxLen > 0 ? levenshtein(a, b) / maxLen : 0;
  const jwDist = 1 - jaroWinkler(a, b);
  const jacDist = 1 - jaccardSimilarity(a, b);
  return (levDist + jwDist + jacDist) / 3;
}

function requireServiceKey(
  headers: Record<string, string | undefined>,
  set: { status?: number | string },
): { success: false; message: string } | null {
  const key = process.env.SECRET_SERVICE_KEY;
  if (key && headers['x-service-key'] !== key) {
    set.status = 401;
    return { success: false, message: 'Unauthorized' };
  }
  return null;
}
import { cors } from "@elysiajs/cors";
import { Effect } from "effect";
import { SqlClient } from "@effect/sql";
import { LiveDatabase } from "./db";

// Simple DB connectivity check effect
const dbHealthCheck = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;
  // Run a no-op query; returns an array with one row if successful
  const rows = yield* sql<{ ok: number }>`select 1 as ok`;
  return rows?.[0]?.ok === 1;
}).pipe(Effect.provide(LiveDatabase));

const app = new Elysia()
  .use(cors({
    origin: process.env.CORS_ORIGIN || true,
    allowedHeaders: ['Content-Type', 'x-mod-token', 'x-service-key'],
  }))
  .get('/api/greeting', () => ({
    message: "Welcome to our wedding website API!"
  }))
  // Health endpoint to verify DB connectivity on demand
  .get('/api/health/db', async () => {
    try {
      const ok = await Effect.runPromise(dbHealthCheck);
      return ok
        ? { status: "ok", message: "Database connection successful" }
        : { status: "degraded", message: "Database check did not return expected result" };
    } catch (error) {
      console.error("Database healthcheck failed:", error);
      return { status: "error", message: "Database connection failed" };
    }
  })
  .post('/api/rsvp', async ({ body, headers, set }) => {
    const authErr = requireServiceKey(headers, set);
    if (authErr) return authErr;
    try {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          const rows = yield* sql<{
            id: number;
            name: string;
            attending: boolean;
            guests: number;
            message: string | null;
            created_at: string;
          }>`
            insert into rsvps (name, attending, guests, message)
            values (${body.name}, ${body.attending}, ${body.guests}, ${body.message ?? null})
            returning id, name, attending, guests, message, created_at
          `;
          return rows[0];
        }).pipe(Effect.provide(LiveDatabase))
      );
      return { success: true, rsvp: result };
    } catch (error) {
      console.error('Failed to save RSVP', error);
      return { success: false, message: 'Failed to save RSVP' };
    }
  }, {
    body: t.Object({
      name: t.String(),
      attending: t.Boolean(),
      guests: t.Number(),
      message: t.Optional(t.String())
    })
  })
  .get('/api/rsvps', async ({ headers, set }) => {
    const authErr = requireServiceKey(headers, set);
    if (authErr) return authErr;
    try {
      const rows = await Effect.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          const list = yield* sql<{
            id: number; name: string; attending: boolean; guests: number; message: string | null; created_at: string;
          }>`select id, name, attending, guests, message, created_at from rsvps order by created_at desc`;
          return list;
        }).pipe(Effect.provide(LiveDatabase))
      );
      return { success: true, rsvps: rows };
    } catch (error) {
      console.error('Failed to fetch RSVPs', error);
      return { success: false, message: 'Failed to fetch RSVPs' };
    }
  })
  // Reject photo payloads larger than ~1.5MB of raw bytes (base64 adds ~33% overhead).
  .post('/api/matchmaking', async ({ body, headers, set }) => {
    const authErr = requireServiceKey(headers, set);
    if (authErr) return authErr;
    if (body.photoBase64 && body.photoBase64.length > 2_200_000) {
      set.status = 413;
      return { success: false, message: 'Photo too large. Please pick a smaller image.' };
    }
    try {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          const rows = yield* sql<{
            id: number;
            submitter_name: string;
            friend_name: string;
            contact: string;
            bio: string | null;
            photo_base64: string | null;
            approved: boolean;
            created_at: string;
          }>`
            insert into matchmaking_submissions (submitter_name, friend_name, contact, bio, photo_base64)
            values (${body.submitterName}, ${body.friendName}, ${body.contact}, ${body.bio ?? null}, ${body.photoBase64 ?? null})
            returning id, submitter_name, friend_name, contact, bio, photo_base64, approved, created_at
          `;
          return rows[0];
        }).pipe(Effect.provide(LiveDatabase))
      );
      return { success: true, submission: result };
    } catch (error) {
      console.error('Failed to save matchmaking submission', error);
      return { success: false, message: 'Failed to save submission' };
    }
  }, {
    body: t.Object({
      submitterName: t.String({ minLength: 1, maxLength: 120 }),
      friendName: t.String({ minLength: 1, maxLength: 120 }),
      contact: t.String({ minLength: 1, maxLength: 200 }),
      bio: t.Optional(t.String({ maxLength: 500 })),
      photoBase64: t.Optional(t.String())
    })
  })
  .get('/api/matchmaking', async ({ headers, set }) => {
    const authErr = requireServiceKey(headers, set);
    if (authErr) return authErr;
    try {
      const rows = await Effect.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          const list = yield* sql<{
            id: number; submitter_name: string; friend_name: string; contact: string; bio: string | null; photo_base64: string | null; approved: boolean; created_at: string;
          }>`
            select id, submitter_name, friend_name, contact, bio, photo_base64, approved, created_at
            from matchmaking_submissions
            where approved = true
            order by created_at desc
          `;
          return list;
        }).pipe(Effect.provide(LiveDatabase))
      );
      return { success: true, submissions: rows };
    } catch (error) {
      console.error('Failed to fetch matchmaking submissions', error);
      return { success: false, message: 'Failed to fetch submissions' };
    }
  })
  .get('/api/matchmaking/all', async ({ headers, set }) => {
    const token = process.env.MODERATE_KEY;
    if (!token || headers['x-mod-token'] !== token) {
      set.status = 401;
      return { success: false, message: 'Unauthorized' };
    }
    try {
      const rows = await Effect.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          const list = yield* sql<{
            id: number; submitter_name: string; friend_name: string; contact: string; bio: string | null; photo_base64: string | null; approved: boolean; created_at: string;
          }>`
            select id, submitter_name, friend_name, contact, bio, photo_base64, approved, created_at
            from matchmaking_submissions
            order by created_at desc
          `;
          return list;
        }).pipe(Effect.provide(LiveDatabase))
      );
      return { success: true, submissions: rows };
    } catch (error) {
      console.error('Failed to fetch all matchmaking submissions', error);
      return { success: false, message: 'Failed to fetch submissions' };
    }
  })
  .patch('/api/matchmaking/:id', async ({ params, body, headers, set }) => {
    const token = process.env.MODERATE_KEY;
    if (!token || headers['x-mod-token'] !== token) {
      set.status = 401;
      return { success: false, message: 'Unauthorized' };
    }
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) {
      set.status = 400;
      return { success: false, message: 'Invalid id' };
    }
    try {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          const rows = yield* sql<{ id: number; approved: boolean }>`
            update matchmaking_submissions
            set approved = ${body.approved}
            where id = ${id}
            returning id, approved
          `;
          return rows[0];
        }).pipe(Effect.provide(LiveDatabase))
      );
      if (!result) {
        set.status = 404;
        return { success: false, message: 'Not found' };
      }
      return { success: true, submission: result };
    } catch (error) {
      console.error('Failed to update matchmaking submission', error);
      return { success: false, message: 'Failed to update submission' };
    }
  }, {
    body: t.Object({ approved: t.Boolean() })
  })
  .delete('/api/matchmaking', async ({ headers, set }) => {
    const token = process.env.MODERATE_KEY;
    if (!token || headers['x-mod-token'] !== token) {
      set.status = 401;
      return { success: false, message: 'Unauthorized' };
    }
    try {
      await Effect.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          yield* sql`delete from matchmaking_submissions`;
        }).pipe(Effect.provide(LiveDatabase))
      );
      return { success: true };
    } catch (error) {
      console.error('Failed to delete all matchmaking submissions', error);
      return { success: false, message: 'Failed to delete submissions.' };
    }
  })
  // --- Lottery ---
  .post('/api/lottery', async ({ body, headers, set }) => {
    const authErr = requireServiceKey(headers, set);
    if (authErr) return authErr;
    const num = body.number.trim();
    if (!/^\d{6}$/.test(num)) {
      set.status = 400;
      return { success: false, message: 'Number must be exactly 6 digits.' };
    }
    try {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          const rows = yield* sql<{ id: number; name: string; number: string; created_at: string }>`
            insert into lottery_entries (name, number)
            values (${body.name.trim()}, ${num})
            returning id, name, number, created_at
          `;
          return rows[0];
        }).pipe(Effect.provide(LiveDatabase))
      );
      return { success: true, entry: result };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '';
      if (msg.includes('unique') || msg.includes('duplicate')) {
        set.status = 409;
        return { success: false, message: 'That number is already taken. Try a different one.' };
      }
      console.error('Failed to save lottery entry', error);
      return { success: false, message: 'Failed to save entry.' };
    }
  }, {
    body: t.Object({
      name: t.String({ minLength: 1, maxLength: 120 }),
      number: t.String({ minLength: 1, maxLength: 6 }),
    })
  })
  .get('/api/lottery/numbers', async ({ headers, set }) => {
    const authErr = requireServiceKey(headers, set);
    if (authErr) return authErr;
    try {
      const rows = await Effect.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          return yield* sql<{ number: string }>`
            select number from lottery_entries
          `;
        }).pipe(Effect.provide(LiveDatabase))
      );
      return { success: true, numbers: rows.map(r => r.number) };
    } catch (error) {
      console.error('Failed to fetch lottery numbers', error);
      return { success: false, message: 'Failed to fetch numbers.' };
    }
  })
  .get('/api/lottery/entries', async ({ headers, set }) => {
    const token = process.env.MODERATE_KEY;
    if (!token || headers['x-mod-token'] !== token) {
      set.status = 401;
      return { success: false, message: 'Unauthorized' };
    }
    try {
      const rows = await Effect.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          return yield* sql<{ id: number; name: string; number: string; created_at: string }>`
            select id, name, number, created_at from lottery_entries order by created_at asc
          `;
        }).pipe(Effect.provide(LiveDatabase))
      );
      return { success: true, entries: rows };
    } catch (error) {
      console.error('Failed to fetch lottery entries', error);
      return { success: false, message: 'Failed to fetch entries.' };
    }
  })
  .post('/api/lottery/draw', async ({ body, headers, set }) => {
    const token = process.env.MODERATE_KEY;
    if (!token || headers['x-mod-token'] !== token) {
      set.status = 401;
      return { success: false, message: 'Unauthorized' };
    }
    const prizeDigits: Record<number, number> = { 1: 6, 2: 3, 3: 2 };
    const digitCount = prizeDigits[body.prizeRank];
    if (!digitCount) {
      set.status = 400;
      return { success: false, message: 'prizeRank must be 1, 2, or 3.' };
    }
    function generateUniqueDigitNumber(n: number): string {
      const pool = Array.from({ length: 10 }, (_, i) => i);
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      return pool.slice(0, n).join('');
    }
    const winningNumber = generateUniqueDigitNumber(digitCount);
    try {
      await Effect.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          yield* sql`
            insert into lottery_draws (prize_rank, winning_number)
            values (${body.prizeRank}, ${winningNumber})
          `;
        }).pipe(Effect.provide(LiveDatabase))
      );
      return { success: true, winningNumber };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '';
      if (msg.includes('unique') || msg.includes('duplicate')) {
        set.status = 409;
        return { success: false, message: `Prize ${body.prizeRank} has already been drawn.` };
      }
      console.error('Failed to draw lottery prize', error);
      return { success: false, message: 'Failed to draw prize.' };
    }
  }, {
    body: t.Object({ prizeRank: t.Number() })
  })
  .get('/api/lottery/results', async ({ headers, set }) => {
    const authErr = requireServiceKey(headers, set);
    if (authErr) return authErr;
    try {
      const { draws, entries } = await Effect.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          const draws = yield* sql<{ prize_rank: number; winning_number: string; drawn_at: string }>`
            select prize_rank, winning_number, drawn_at from lottery_draws order by prize_rank asc
          `;
          const entries = yield* sql<{ name: string; number: string }>`
            select name, number from lottery_entries
          `;
          return { draws, entries };
        }).pipe(Effect.provide(LiveDatabase))
      );

      type ClosestEntry = { name: string; number: string; string_distance: number; number_difference: number };

      const results = draws.map((draw) => {
        const wn = draw.winning_number;
        // Extract the relevant suffix from a user's 6-digit number for this prize rank
        const suffix = (num: string) =>
          draw.prize_rank === 1 ? num : draw.prize_rank === 2 ? num.slice(-3) : num.slice(-2);

        const winners = entries.filter((e) => suffix(e.number) === wn);

        if (winners.length > 0 || entries.length === 0) {
          return { ...draw, winners, closest_by_string: null, closest_by_number: null };
        }

        const scored = entries.map((e) => ({
          name: e.name, number: e.number,
          string_distance: combinedStringDistance(wn, suffix(e.number)),
          number_difference: Math.abs(parseInt(wn, 10) - parseInt(suffix(e.number), 10)),
        }));
        const byString = scored.reduce((best, cur) =>
          cur.string_distance < best.string_distance ||
          (cur.string_distance === best.string_distance && cur.number_difference < best.number_difference)
            ? cur : best
        );
        const byNumber = scored.reduce((best, cur) =>
          cur.number_difference < best.number_difference ||
          (cur.number_difference === best.number_difference && cur.string_distance < best.string_distance)
            ? cur : best
        );
        return {
          ...draw, winners,
          closest_by_string: byString as ClosestEntry,
          closest_by_number: (byNumber.number !== byString.number ? byNumber : null) as ClosestEntry | null,
        };
      });

      return { success: true, results };
    } catch (error) {
      console.error('Failed to fetch lottery results', error);
      return { success: false, message: 'Failed to fetch results.' };
    }
  })
  .delete('/api/lottery/draws', async ({ headers, set }) => {
    const token = process.env.MODERATE_KEY;
    if (!token || headers['x-mod-token'] !== token) {
      set.status = 401;
      return { success: false, message: 'Unauthorized' };
    }
    try {
      await Effect.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          yield* sql`delete from lottery_draws`;
        }).pipe(Effect.provide(LiveDatabase))
      );
      return { success: true };
    } catch (error) {
      console.error('Failed to reset lottery draws', error);
      return { success: false, message: 'Failed to reset.' };
    }
  })
  .delete('/api/lottery', async ({ headers, set }) => {
    const token = process.env.MODERATE_KEY;
    if (!token || headers['x-mod-token'] !== token) {
      set.status = 401;
      return { success: false, message: 'Unauthorized' };
    }
    try {
      await Effect.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          yield* sql`delete from lottery_draws`;
          yield* sql`delete from lottery_entries`;
        }).pipe(Effect.provide(LiveDatabase))
      );
      return { success: true };
    } catch (error) {
      console.error('Failed to full reset lottery', error);
      return { success: false, message: 'Failed to reset.' };
    }
  })
  .listen(3000);

// Run a connectivity check on startup and log the result
Effect.runPromise(dbHealthCheck)
  .then((ok) => {
    if (ok) console.log("✅ Database connection successful");
    else console.warn("⚠️ Database connection check returned unexpected result");
  })
  .catch((err) => console.error("❌ Database connection failed:", err));

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);