import { Elysia, t } from 'elysia';
import { Effect } from 'effect';
import { SqlClient } from '@effect/sql';
import { LiveDatabase } from '../db';
import { requireServiceKey } from '../lib/auth';

export const rsvpRoutes = new Elysia()
  .post('/api/rsvp', async ({ body, headers, set }) => {
    const authErr = requireServiceKey(headers, set);
    if (authErr) return authErr;
    try {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          const rows = yield* sql<{
            id: number; name: string; attending: boolean; guests: number; message: string | null; created_at: string;
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
      message: t.Optional(t.String()),
    }),
  })
  .get('/api/rsvps', async ({ headers, set }) => {
    const authErr = requireServiceKey(headers, set);
    if (authErr) return authErr;
    try {
      const rows = await Effect.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          return yield* sql<{
            id: number; name: string; attending: boolean; guests: number; message: string | null; created_at: string;
          }>`select id, name, attending, guests, message, created_at from rsvps order by created_at desc`;
        }).pipe(Effect.provide(LiveDatabase))
      );
      return { success: true, rsvps: rows };
    } catch (error) {
      console.error('Failed to fetch RSVPs', error);
      return { success: false, message: 'Failed to fetch RSVPs' };
    }
  });
