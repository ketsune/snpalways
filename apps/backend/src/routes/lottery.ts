import { Elysia, t } from 'elysia';
import { Effect } from 'effect';
import { SqlClient } from '@effect/sql';
import { LiveDatabase } from '../db';
import { requireServiceKey, requireModToken } from '../lib/auth';
import { isUniqueViolation } from '../lib/errors';

const PRIZE_DIGITS: Record<number, number> = { 1: 6, 2: 3, 3: 2 };

const suffix = (num: string, prizeRank: number) =>
  prizeRank === 1 ? num : prizeRank === 2 ? num.slice(-3) : num.slice(-2);

export const lotteryRoutes = new Elysia()
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
      if (isUniqueViolation(error)) {
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
    }),
  })
  .get('/api/lottery/numbers', async ({ headers, set }) => {
    const authErr = requireServiceKey(headers, set);
    if (authErr) return authErr;
    try {
      const rows = await Effect.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          return yield* sql<{ number: string }>`select number from lottery_entries`;
        }).pipe(Effect.provide(LiveDatabase))
      );
      return { success: true, numbers: rows.map(r => r.number) };
    } catch (error) {
      console.error('Failed to fetch lottery numbers', error);
      return { success: false, message: 'Failed to fetch numbers.' };
    }
  })
  .get('/api/lottery/entries', async ({ headers, set }) => {
    const authErr = requireModToken(headers, set);
    if (authErr) return authErr;
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
    const authErr = requireModToken(headers, set);
    if (authErr) return authErr;
    const digitCount = PRIZE_DIGITS[body.prizeRank];
    if (!digitCount) {
      set.status = 400;
      return { success: false, message: 'prizeRank must be 1, 2, or 3.' };
    }
    try {
      // Build the pool from actual submitted entries
      const entries = await Effect.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          return yield* sql<{ number: string }>`select number from lottery_entries`;
        }).pipe(Effect.provide(LiveDatabase))
      );
      if (entries.length === 0) {
        set.status = 400;
        return { success: false, message: 'No entries to draw from.' };
      }

      // For 2nd/3rd prize use distinct suffix pool so the draw is over unique
      // last-N-digit values, not weighted by how many full numbers share a suffix.
      const pool = [...new Set(entries.map(e => suffix(e.number, body.prizeRank)))];
      const winningNumber = pool[Math.floor(Math.random() * pool.length)];

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
      if (isUniqueViolation(error)) {
        set.status = 409;
        return { success: false, message: `Prize ${body.prizeRank} has already been drawn.` };
      }
      console.error('Failed to draw lottery prize', error);
      return { success: false, message: 'Failed to draw prize.' };
    }
  }, {
    body: t.Object({ prizeRank: t.Number() }),
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

      const results = draws.map((draw) => ({
        ...draw,
        winners: entries.filter((e) => suffix(e.number, draw.prize_rank) === draw.winning_number),
      }));

      return { success: true, results };
    } catch (error) {
      console.error('Failed to fetch lottery results', error);
      return { success: false, message: 'Failed to fetch results.' };
    }
  })
  .delete('/api/lottery/draws', async ({ headers, set }) => {
    const authErr = requireModToken(headers, set);
    if (authErr) return authErr;
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
    const authErr = requireModToken(headers, set);
    if (authErr) return authErr;
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
  });
