import { Elysia, t } from 'elysia';
import { Effect } from 'effect';
import { SqlClient } from '@effect/sql';
import { LiveDatabase } from '../db';
import { requireServiceKey, requireModToken } from '../lib/auth';
import { isUniqueViolation } from '../lib/errors';

const PRIZE_DIGITS: Record<number, number> = { 1: 6, 2: 3, 3: 3 };

// extract the matching portion from a 6-digit number for a given prize rank
// prize 1: full 6 digits | prize 2: first 3 digits | prize 3: last 3 digits
const extract = (num: string, prizeRank: number) =>
  prizeRank === 1 ? num : prizeRank === 2 ? num.slice(0, 3) : num.slice(-3);

export const lotteryRoutes = new Elysia()
  .post('/api/lottery', async ({ body, headers, set }) => {
    const authErr = requireServiceKey(headers, set);
    if (authErr) return authErr;
    const num = body.number.trim();
    if (!/^\d{6}$/.test(num)) {
      set.status = 400;
      return { success: false, message: 'หมายเลขต้องมี 6 หลักเท่านั้น' };
    }
    const tableNo = body.table_no?.trim() || null;
    try {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          const rows = yield* sql<{ id: number; name: string; number: string; table_no: string | null; created_at: string }>`
            insert into lottery_entries (name, number, table_no)
            values (${body.name.trim()}, ${num}, ${tableNo})
            returning id, name, number, table_no, created_at
          `;
          return rows[0];
        }).pipe(Effect.provide(LiveDatabase))
      );
      return { success: true, entry: result };
    } catch (error: unknown) {
      if (isUniqueViolation(error)) {
        set.status = 409;
        return { success: false, message: 'หมายเลขนี้ถูกใช้ไปแล้ว กรุณาเลือกหมายเลขอื่น' };
      }
      console.error('Failed to save lottery entry', error);
      return { success: false, message: 'ไม่สามารถบันทึกข้อมูลได้' };
    }
  }, {
    body: t.Object({
      name: t.String({ minLength: 1, maxLength: 120 }),
      number: t.String({ minLength: 1, maxLength: 6 }),
      table_no: t.Optional(t.String({ maxLength: 20 })),
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
      return { success: false, message: 'ไม่สามารถดึงข้อมูลหมายเลขได้' };
    }
  })
  .get('/api/lottery/entries', async ({ headers, set }) => {
    const authErr = requireModToken(headers, set);
    if (authErr) return authErr;
    try {
      const rows = await Effect.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          return yield* sql<{ id: number; name: string; number: string; table_no: string | null; created_at: string }>`
            select id, name, number, table_no, created_at from lottery_entries order by created_at asc
          `;
        }).pipe(Effect.provide(LiveDatabase))
      );
      return { success: true, entries: rows };
    } catch (error) {
      console.error('Failed to fetch lottery entries', error);
      return { success: false, message: 'ไม่สามารถดึงข้อมูลได้' };
    }
  })
  .post('/api/lottery/draw', async ({ body, headers, set }) => {
    const authErr = requireModToken(headers, set);
    if (authErr) return authErr;
    const digitCount = PRIZE_DIGITS[body.prizeRank];
    if (!digitCount) {
      set.status = 400;
      return { success: false, message: 'ลำดับรางวัลต้องเป็น 1, 2 หรือ 3 เท่านั้น' };
    }
    try {
      const { entries, draws } = await Effect.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          const entries = yield* sql<{ name: string; number: string }>`select name, number from lottery_entries`;
          const draws = yield* sql<{ prize_rank: number; winning_number: string }>`select prize_rank, winning_number from lottery_draws`;
          return { entries, draws };
        }).pipe(Effect.provide(LiveDatabase))
      );

      if (entries.length === 0) {
        set.status = 400;
        return { success: false, message: 'ยังไม่มีผู้เข้าร่วมในการจับรางวัล' };
      }

      // Cross-prize exclusion: prize 2 and 3 winner must not be the same person.
      // Collect names that already won the "sibling" prize.
      const excludedNames = new Set<string>();
      if (body.prizeRank === 2 || body.prizeRank === 3) {
        const siblingRank = body.prizeRank === 2 ? 3 : 2;
        const siblingDraw = draws.find(d => d.prize_rank === siblingRank);
        if (siblingDraw) {
          const siblingExt = siblingDraw.winning_number; // already stored as extracted value
          for (const e of entries) {
            if (extract(e.number, siblingRank) === siblingExt) {
              excludedNames.add(e.name);
            }
          }
        }
      }

      // Build the pool from actual submitted entries, excluding cross-prize winners.
      const eligibleEntries = excludedNames.size > 0
        ? entries.filter(e => !excludedNames.has(e.name))
        : entries;

      if (eligibleEntries.length === 0) {
        set.status = 400;
        return { success: false, message: 'ไม่มีผู้เข้าร่วมที่มีสิทธิ์รับรางวัลนี้ (ผู้รับรางวัลอื่นถูกยกเว้น)' };
      }

      // For 2nd/3rd prize use distinct extracted-value pool so the draw is over
      // unique prefix/suffix values, not weighted by how many numbers share one.
      const pool = [...new Set(eligibleEntries.map(e => extract(e.number, body.prizeRank)))];
      const winningNumber = pool[Math.floor(Math.random() * pool.length)];

      await Effect.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          yield* sql`
            insert into lottery_draws (prize_rank, winning_number, revealed_digits)
            values (${body.prizeRank}, ${winningNumber}, 0)
          `;
        }).pipe(Effect.provide(LiveDatabase))
      );
      return { success: true, winningNumber };
    } catch (error: unknown) {
      if (isUniqueViolation(error)) {
        set.status = 409;
        return { success: false, message: `รางวัลที่ ${body.prizeRank} ถูกจับไปแล้ว` };
      }
      console.error('Failed to draw lottery prize', error);
      return { success: false, message: 'ไม่สามารถจับรางวัลได้' };
    }
  }, {
    body: t.Object({ prizeRank: t.Number() }),
  })
  .patch('/api/lottery/draw/:id/reveal', async ({ params, headers, set }) => {
    const authErr = requireModToken(headers, set);
    if (authErr) return authErr;
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) {
      set.status = 400;
      return { success: false, message: 'invalid draw id' };
    }
    try {
      const updated = await Effect.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          const rows = yield* sql<{ id: number; prize_rank: number; revealed_digits: number }>`
            update lottery_draws
            set revealed_digits = least(revealed_digits + 1, ${6})
            where id = ${id}
            returning id, prize_rank, revealed_digits
          `;
          return rows[0];
        }).pipe(Effect.provide(LiveDatabase))
      );
      if (!updated) {
        set.status = 404;
        return { success: false, message: 'draw not found' };
      }
      return { success: true, draw: updated };
    } catch (error) {
      console.error('Failed to reveal digit', error);
      return { success: false, message: 'ไม่สามารถอัปเดตได้' };
    }
  })
  .get('/api/lottery/results', async ({ headers, set }) => {
    const authErr = requireServiceKey(headers, set);
    if (authErr) return authErr;
    try {
      const { draws, entries } = await Effect.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          const draws = yield* sql<{ id: number; prize_rank: number; winning_number: string; revealed_digits: number; drawn_at: string }>`
            select id, prize_rank, winning_number, revealed_digits, drawn_at from lottery_draws order by prize_rank asc
          `;
          const entries = yield* sql<{ name: string; number: string; table_no: string | null; created_at: string }>`
            select name, number, table_no, created_at from lottery_entries order by created_at asc
          `;
          return { draws, entries };
        }).pipe(Effect.provide(LiveDatabase))
      );

      const results = draws.map((draw) => ({
        ...draw,
        winners: entries.filter((e) => extract(e.number, draw.prize_rank) === draw.winning_number),
      }));

      const recent_entries = entries.slice(-15).reverse().map(({ name, number }) => ({ name, number }));
      return { success: true, results, total_entries: entries.length, recent_entries };
    } catch (error) {
      console.error('Failed to fetch lottery results', error);
      return { success: false, message: 'ไม่สามารถดึงผลการจับรางวัลได้' };
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
      return { success: false, message: 'ไม่สามารถรีเซ็ตข้อมูลได้' };
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
      return { success: false, message: 'ไม่สามารถรีเซ็ตข้อมูลได้' };
    }
  });
