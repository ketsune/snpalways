import { Elysia, t } from 'elysia';
import { Effect } from 'effect';
import { SqlClient } from '@effect/sql';
import { dbRuntime } from '../db';
import { requireModToken } from '../lib/auth';

export const seatsRoutes = new Elysia()

  // Public: search by name
  .get('/api/seats', async ({ query, set }) => {
    const q = (query.q ?? '').trim();
    if (!q) return { success: true, seats: [] };
    try {
      const rows = await dbRuntime.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          return yield* sql<{ id: number; name: string; table_name: string }>`
            SELECT id, name, table_name
            FROM seats
            WHERE name ILIKE ${'%' + q + '%'}
            ORDER BY name ASC
            LIMIT 40
          `;
        })
      );
      return { success: true, seats: rows };
    } catch {
      set.status = 500;
      return { success: false, message: 'ไม่สามารถค้นหาได้' };
    }
  }, { query: t.Object({ q: t.Optional(t.String()) }) })

  // Mod: list all
  .get('/api/seats/all', async ({ headers, set }) => {
    const auth = requireModToken(headers, set);
    if (auth) return auth;
    try {
      const rows = await dbRuntime.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          return yield* sql<{ id: number; name: string; table_name: string }>`
            SELECT id, name, table_name FROM seats ORDER BY table_name ASC, name ASC
          `;
        })
      );
      return { success: true, seats: rows };
    } catch {
      set.status = 500;
      return { success: false, message: 'ไม่สามารถโหลดข้อมูลได้' };
    }
  })

  // Mod: add single seat
  .post('/api/seats', async ({ body, headers, set }) => {
    const auth = requireModToken(headers, set);
    if (auth) return auth;
    try {
      const rows = await dbRuntime.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          return yield* sql<{ id: number; name: string; table_name: string }>`
            INSERT INTO seats (name, table_name) VALUES (${body.name.trim()}, ${body.table_name.trim()})
            RETURNING id, name, table_name
          `;
        })
      );
      return { success: true, seat: rows[0] };
    } catch {
      set.status = 500;
      return { success: false, message: 'ไม่สามารถบันทึกข้อมูลได้' };
    }
  }, {
    body: t.Object({
      name: t.String({ minLength: 1, maxLength: 200 }),
      table_name: t.String({ minLength: 1, maxLength: 50 }),
    }),
  })

  // Mod: update single seat
  .patch('/api/seats/:id', async ({ params, body, headers, set }) => {
    const auth = requireModToken(headers, set);
    if (auth) return auth;
    try {
      const rows = await dbRuntime.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          return yield* sql<{ id: number; name: string; table_name: string }>`
            UPDATE seats SET name = ${body.name.trim()}, table_name = ${body.table_name.trim()}
            WHERE id = ${Number(params.id)}
            RETURNING id, name, table_name
          `;
        })
      );
      if (!rows.length) { set.status = 404; return { success: false, message: 'ไม่พบข้อมูล' }; }
      return { success: true, seat: rows[0] };
    } catch {
      set.status = 500;
      return { success: false, message: 'ไม่สามารถอัปเดตข้อมูลได้' };
    }
  }, {
    body: t.Object({
      name: t.String({ minLength: 1, maxLength: 200 }),
      table_name: t.String({ minLength: 1, maxLength: 50 }),
    }),
  })

  // Mod: delete single seat
  .delete('/api/seats/:id', async ({ params, headers, set }) => {
    const auth = requireModToken(headers, set);
    if (auth) return auth;
    try {
      await dbRuntime.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          yield* sql`DELETE FROM seats WHERE id = ${Number(params.id)}`;
        })
      );
      return { success: true };
    } catch {
      set.status = 500;
      return { success: false, message: 'ไม่สามารถลบข้อมูลได้' };
    }
  })

  // Mod: import from CSV (overwrite all)
  .post('/api/seats/import', async ({ body, headers, set }) => {
    const auth = requireModToken(headers, set);
    if (auth) return auth;
    const rows = body.rows;
    if (!rows.length) { set.status = 400; return { success: false, message: 'ไม่มีข้อมูลที่จะนำเข้า' }; }
    try {
      const inserted = await dbRuntime.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          yield* sql`DELETE FROM seats`;
          const results: { id: number; name: string; table_name: string }[] = [];
          for (const row of rows) {
            const r = yield* sql<{ id: number; name: string; table_name: string }>`
              INSERT INTO seats (name, table_name) VALUES (${row.name.trim()}, ${row.table_name.trim()})
              RETURNING id, name, table_name
            `;
            if (r[0]) results.push(r[0]);
          }
          return results;
        })
      );
      return { success: true, count: inserted.length, seats: inserted };
    } catch (err) {
      console.error('import error', err);
      set.status = 500;
      return { success: false, message: 'นำเข้าข้อมูลไม่สำเร็จ' };
    }
  }, {
    body: t.Object({
      rows: t.Array(t.Object({
        name: t.String({ minLength: 1, maxLength: 200 }),
        table_name: t.String({ minLength: 1, maxLength: 50 }),
      }), { minItems: 1 }),
    }),
  })

  // Mod: delete all seats
  .delete('/api/seats', async ({ headers, set }) => {
    const auth = requireModToken(headers, set);
    if (auth) return auth;
    try {
      await dbRuntime.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          yield* sql`DELETE FROM seats`;
        })
      );
      return { success: true };
    } catch {
      set.status = 500;
      return { success: false, message: 'ไม่สามารถลบข้อมูลได้' };
    }
  });
