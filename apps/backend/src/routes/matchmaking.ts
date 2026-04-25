import { Elysia, t } from 'elysia';
import { Effect } from 'effect';
import { SqlClient } from '@effect/sql';
import { LiveDatabase } from '../db';
import { requireServiceKey, requireModToken } from '../lib/auth';

export const matchmakingRoutes = new Elysia()
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
            id: number; submitter_name: string; friend_name: string; contact: string;
            bio: string | null; photo_base64: string | null; approved: boolean; created_at: string;
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
      photoBase64: t.Optional(t.String()),
    }),
  })
  .get('/api/matchmaking', async ({ headers, set }) => {
    const authErr = requireServiceKey(headers, set);
    if (authErr) return authErr;
    try {
      const rows = await Effect.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          return yield* sql<{
            id: number; submitter_name: string; friend_name: string; contact: string;
            bio: string | null; photo_base64: string | null; approved: boolean; created_at: string;
          }>`
            select id, submitter_name, friend_name, contact, bio, photo_base64, approved, created_at
            from matchmaking_submissions
            where approved = true
            order by created_at desc
          `;
        }).pipe(Effect.provide(LiveDatabase))
      );
      return { success: true, submissions: rows };
    } catch (error) {
      console.error('Failed to fetch matchmaking submissions', error);
      return { success: false, message: 'Failed to fetch submissions' };
    }
  })
  .get('/api/matchmaking/all', async ({ headers, set }) => {
    const authErr = requireModToken(headers, set);
    if (authErr) return authErr;
    try {
      const rows = await Effect.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          return yield* sql<{
            id: number; submitter_name: string; friend_name: string; contact: string;
            bio: string | null; photo_base64: string | null; approved: boolean; created_at: string;
          }>`
            select id, submitter_name, friend_name, contact, bio, photo_base64, approved, created_at
            from matchmaking_submissions
            order by created_at desc
          `;
        }).pipe(Effect.provide(LiveDatabase))
      );
      return { success: true, submissions: rows };
    } catch (error) {
      console.error('Failed to fetch all matchmaking submissions', error);
      return { success: false, message: 'Failed to fetch submissions' };
    }
  })
  .patch('/api/matchmaking/:id', async ({ params, body, headers, set }) => {
    const authErr = requireModToken(headers, set);
    if (authErr) return authErr;
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
    body: t.Object({ approved: t.Boolean() }),
  })
  .delete('/api/matchmaking', async ({ headers, set }) => {
    const authErr = requireModToken(headers, set);
    if (authErr) return authErr;
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
  });
