import { Elysia, t } from 'elysia';
import { Effect } from 'effect';
import { SqlClient } from '@effect/sql';
import { dbRuntime } from '../db';
import { requireServiceKey, requireModToken } from '../lib/auth';

// Mission Hunt routes — see llm-wiki/requirements/mission-hunt.md.
// Photos default approved=true (opt-out moderation, mirrors matchmaking).
// Mod endpoints gated by x-mod-token; guest endpoints by x-service-key (when configured).

// 30-second display delay between photo insert and mosaic visibility.
const FEED_DELAY_MS = 30_000;
const PHOTO_FULL_MAX_BYTES = 2_200_000;
const PHOTO_THUMB_MAX_BYTES = 200_000;

type MissionRow = {
  id: number;
  position: number;
  title: string;
  description: string | null;
  example_thumb_base64: string | null;
  points: number;
  active: boolean;
  created_at: string;
};

type PhotoRow = {
  id: number;
  mission_id: number;
  hunter_token: string;
  hunter_name: string;
  hunter_table: string | null;
  thumb_base64: string;
  full_base64: string;
  approved: boolean;
  created_at: string;
};

export const huntRoutes = new Elysia()
  // ────────────────────────────────────────────────────────────────────
  // Guest endpoints
  // ────────────────────────────────────────────────────────────────────
  .get('/api/hunt/missions', async ({ headers, set }) => {
    const authErr = requireServiceKey(headers, set);
    if (authErr) return authErr;
    try {
      const rows = await dbRuntime.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          return yield* sql<Omit<MissionRow, 'description'> & { description: string | null }>`
            select id, position, title, description, example_thumb_base64, points, active, created_at
            from hunt_missions
            where active = true
            order by position asc, id asc
          `;
        }),
      );
      return { success: true, missions: rows };
    } catch (error) {
      console.error('Failed to fetch hunt missions', error);
      return { success: false, message: 'Failed to fetch missions.' };
    }
  })
  .post('/api/hunt/photo', async ({ body, headers, set }) => {
    const authErr = requireServiceKey(headers, set);
    if (authErr) return authErr;

    if (body.fullBase64.length > PHOTO_FULL_MAX_BYTES) {
      set.status = 413;
      return { success: false, message: 'Photo too large. Please pick a smaller image.' };
    }
    if (body.thumbBase64.length > PHOTO_THUMB_MAX_BYTES) {
      set.status = 413;
      return { success: false, message: 'Thumbnail too large.' };
    }
    if (!body.fullBase64.startsWith('data:image/jpeg;base64,') ||
        !body.thumbBase64.startsWith('data:image/jpeg;base64,')) {
      set.status = 400;
      return { success: false, message: 'Photo must be a JPEG data URL.' };
    }

    try {
      const result = await dbRuntime.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;

          // Verify the mission exists and is active.
          const missions = yield* sql<{ id: number; points: number }>`
            select id, points from hunt_missions where id = ${body.missionId} and active = true
          `;
          if (missions.length === 0) {
            return { kind: 'mission_missing' as const };
          }
          const missionPoints = missions[0]!.points;

          // Did this hunter already have an approved photo for this mission?
          const prior = yield* sql<{ count: string }>`
            select count(*) as count
            from hunt_photos
            where mission_id = ${body.missionId}
              and hunter_token = ${body.hunterToken}
              and approved = true
          `;
          const alreadyEarned = Number(prior[0]?.count ?? 0) > 0;

          const inserted = yield* sql<{ id: number; created_at: string }>`
            insert into hunt_photos
              (mission_id, hunter_token, hunter_name, hunter_table, thumb_base64, full_base64)
            values
              (${body.missionId}, ${body.hunterToken}, ${body.hunterName.trim()},
               ${body.hunterTable?.trim() || null}, ${body.thumbBase64}, ${body.fullBase64})
            returning id, created_at
          `;

          return {
            kind: 'ok' as const,
            id: inserted[0]!.id,
            createdAt: inserted[0]!.created_at,
            pointsAwarded: alreadyEarned ? 0 : missionPoints,
          };
        }),
      );

      if (result.kind === 'mission_missing') {
        set.status = 404;
        return { success: false, message: 'Mission not found or inactive.' };
      }
      return {
        success: true,
        photo: { id: result.id, createdAt: result.createdAt },
        pointsAwarded: result.pointsAwarded,
      };
    } catch (error) {
      console.error('Failed to save hunt photo', error);
      return { success: false, message: 'Failed to save photo.' };
    }
  }, {
    body: t.Object({
      missionId: t.Number(),
      hunterToken: t.String({ minLength: 8, maxLength: 64 }),
      hunterName: t.String({ minLength: 1, maxLength: 80 }),
      hunterTable: t.Optional(t.String({ maxLength: 20 })),
      thumbBase64: t.String(),
      fullBase64: t.String(),
    }),
  })
  .get('/api/hunt/feed', async ({ query, headers, set }) => {
    const authErr = requireServiceKey(headers, set);
    if (authErr) return authErr;
    const limit = Math.min(Math.max(Number(query.limit ?? 60) || 60, 1), 200);
    const since = typeof query.since === 'string' ? new Date(query.since) : null;
    const sinceValid = since && !Number.isNaN(since.getTime());
    try {
      const rows = await dbRuntime.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          // Photos are visible to the mosaic only after FEED_DELAY_MS elapsed,
          // giving moderators a window to flag.
          const cutoff = new Date(Date.now() - FEED_DELAY_MS);
          if (sinceValid) {
            return yield* sql<Omit<PhotoRow, 'full_base64'>>`
              select id, mission_id, hunter_token, hunter_name, hunter_table,
                     thumb_base64, '' as full_base64, approved, created_at
              from hunt_photos
              where approved = true
                and created_at <= ${cutoff}
                and created_at > ${since!}
              order by created_at desc
              limit ${limit}
            `;
          }
          return yield* sql<Omit<PhotoRow, 'full_base64'>>`
            select id, mission_id, hunter_token, hunter_name, hunter_table,
                   thumb_base64, '' as full_base64, approved, created_at
            from hunt_photos
            where approved = true
              and created_at <= ${cutoff}
            order by created_at desc
            limit ${limit}
          `;
        }),
      );
      return {
        success: true,
        photos: rows.map((r) => ({
          id: r.id,
          missionId: r.mission_id,
          hunterName: r.hunter_name,
          hunterTable: r.hunter_table,
          thumbBase64: r.thumb_base64,
          createdAt: r.created_at,
        })),
      };
    } catch (error) {
      console.error('Failed to fetch hunt feed', error);
      return { success: false, message: 'Failed to fetch feed.' };
    }
  })
  .get('/api/hunt/photo/:id', async ({ params, headers, set }) => {
    const authErr = requireServiceKey(headers, set);
    if (authErr) return authErr;
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) {
      set.status = 400;
      return { success: false, message: 'Invalid id' };
    }
    try {
      const rows = await dbRuntime.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          return yield* sql<{ id: number; mission_id: number; hunter_name: string; full_base64: string; approved: boolean; created_at: string }>`
            select id, mission_id, hunter_name, full_base64, approved, created_at
            from hunt_photos
            where id = ${id} and approved = true
          `;
        }),
      );
      const row = rows[0];
      if (!row) {
        set.status = 404;
        return { success: false, message: 'Photo not found.' };
      }
      return {
        success: true,
        photo: {
          id: row.id,
          missionId: row.mission_id,
          hunterName: row.hunter_name,
          fullBase64: row.full_base64,
          createdAt: row.created_at,
        },
      };
    } catch (error) {
      console.error('Failed to fetch hunt photo', error);
      return { success: false, message: 'Failed to fetch photo.' };
    }
  })
  .get('/api/hunt/leaderboard', async ({ query, headers, set }) => {
    const authErr = requireServiceKey(headers, set);
    if (authErr) return authErr;
    const limit = Math.min(Math.max(Number(query.limit ?? 20) || 20, 1), 100);
    try {
      const rows = await dbRuntime.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          // Score = sum of points across distinct missions the hunter completed
          // (multiple photos for the same mission count once).
          return yield* sql<{
            hunter_token: string;
            hunter_name: string;
            hunter_table: string | null;
            missions_completed: string;
            total_points: string;
          }>`
            with hunter_missions as (
              select distinct p.hunter_token, p.mission_id
              from hunt_photos p
              where p.approved = true
            ),
            hunter_latest_name as (
              select distinct on (hunter_token)
                hunter_token, hunter_name, hunter_table
              from hunt_photos
              where approved = true
              order by hunter_token, created_at desc
            )
            select
              hm.hunter_token,
              hln.hunter_name,
              hln.hunter_table,
              count(*)::text as missions_completed,
              sum(m.points)::text as total_points
            from hunter_missions hm
            join hunt_missions m on m.id = hm.mission_id
            join hunter_latest_name hln on hln.hunter_token = hm.hunter_token
            group by hm.hunter_token, hln.hunter_name, hln.hunter_table
            order by sum(m.points) desc, count(*) desc, hln.hunter_name asc
            limit ${limit}
          `;
        }),
      );
      return {
        success: true,
        hunters: rows.map((r, i) => ({
          rank: i + 1,
          hunterName: r.hunter_name,
          hunterTable: r.hunter_table,
          missionsCompleted: Number(r.missions_completed),
          totalPoints: Number(r.total_points),
        })),
      };
    } catch (error) {
      console.error('Failed to fetch hunt leaderboard', error);
      return { success: false, message: 'Failed to fetch leaderboard.' };
    }
  })
  .get('/api/hunt/me', async ({ query, headers, set }) => {
    const authErr = requireServiceKey(headers, set);
    if (authErr) return authErr;
    const token = typeof query.token === 'string' ? query.token : '';
    if (!token) {
      set.status = 400;
      return { success: false, message: 'token query param required.' };
    }
    try {
      const result = await dbRuntime.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          const completed = yield* sql<{ mission_id: number; points: number }>`
            select distinct p.mission_id, m.points
            from hunt_photos p
            join hunt_missions m on m.id = p.mission_id
            where p.hunter_token = ${token} and p.approved = true
          `;
          return completed;
        }),
      );
      const completedMissionIds = result.map((r) => r.mission_id);
      const totalPoints = result.reduce((sum, r) => sum + Number(r.points), 0);
      return { success: true, completedMissionIds, totalPoints };
    } catch (error) {
      console.error('Failed to fetch hunt me', error);
      return { success: false, message: 'Failed to fetch hunter state.' };
    }
  })

  // ────────────────────────────────────────────────────────────────────
  // Moderator endpoints — photos
  // ────────────────────────────────────────────────────────────────────
  .get('/api/hunt/photos/all', async ({ headers, set }) => {
    const authErr = requireModToken(headers, set);
    if (authErr) return authErr;
    try {
      const rows = await dbRuntime.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          return yield* sql<Omit<PhotoRow, 'full_base64'>>`
            select id, mission_id, hunter_token, hunter_name, hunter_table,
                   thumb_base64, '' as full_base64, approved, created_at
            from hunt_photos
            order by created_at desc
            limit 500
          `;
        }),
      );
      return {
        success: true,
        photos: rows.map((r) => ({
          id: r.id,
          missionId: r.mission_id,
          hunterToken: r.hunter_token,
          hunterName: r.hunter_name,
          hunterTable: r.hunter_table,
          thumbBase64: r.thumb_base64,
          approved: r.approved,
          createdAt: r.created_at,
        })),
      };
    } catch (error) {
      console.error('Failed to fetch all hunt photos', error);
      return { success: false, message: 'Failed to fetch photos.' };
    }
  })
  .patch('/api/hunt/photo/:id', async ({ params, body, headers, set }) => {
    const authErr = requireModToken(headers, set);
    if (authErr) return authErr;
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) {
      set.status = 400;
      return { success: false, message: 'Invalid id' };
    }
    try {
      const result = await dbRuntime.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          const rows = yield* sql<{ id: number; approved: boolean }>`
            update hunt_photos set approved = ${body.approved} where id = ${id}
            returning id, approved
          `;
          return rows[0];
        }),
      );
      if (!result) {
        set.status = 404;
        return { success: false, message: 'Not found' };
      }
      return { success: true, photo: result };
    } catch (error) {
      console.error('Failed to update hunt photo', error);
      return { success: false, message: 'Failed to update photo.' };
    }
  }, {
    body: t.Object({ approved: t.Boolean() }),
  })
  .delete('/api/hunt/photo/:id', async ({ params, headers, set }) => {
    const authErr = requireModToken(headers, set);
    if (authErr) return authErr;
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) {
      set.status = 400;
      return { success: false, message: 'Invalid id' };
    }
    try {
      const result = await dbRuntime.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          const rows = yield* sql<{ id: number }>`delete from hunt_photos where id = ${id} returning id`;
          return rows[0];
        }),
      );
      if (!result) {
        set.status = 404;
        return { success: false, message: 'Not found' };
      }
      return { success: true, deletedPhotoId: result.id };
    } catch (error) {
      console.error('Failed to delete hunt photo', error);
      return { success: false, message: 'Failed to delete photo.' };
    }
  })
  .delete('/api/hunt/photos', async ({ headers, set }) => {
    const authErr = requireModToken(headers, set);
    if (authErr) return authErr;
    try {
      const deleted = await dbRuntime.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          const rows = yield* sql<{ count: string }>`
            with d as (delete from hunt_photos returning 1)
            select count(*)::text as count from d
          `;
          return Number(rows[0]?.count ?? 0);
        }),
      );
      return { success: true, deletedPhotoCount: deleted };
    } catch (error) {
      console.error('Failed to wipe hunt photos', error);
      return { success: false, message: 'Failed to wipe photos.' };
    }
  })

  // ────────────────────────────────────────────────────────────────────
  // Moderator endpoints — missions
  // ────────────────────────────────────────────────────────────────────
  .get('/api/hunt/missions/all', async ({ headers, set }) => {
    const authErr = requireModToken(headers, set);
    if (authErr) return authErr;
    try {
      const rows = await dbRuntime.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          return yield* sql<MissionRow>`
            select id, position, title, description, example_thumb_base64, points, active, created_at
            from hunt_missions
            order by position asc, id asc
          `;
        }),
      );
      return { success: true, missions: rows };
    } catch (error) {
      console.error('Failed to fetch all hunt missions', error);
      return { success: false, message: 'Failed to fetch missions.' };
    }
  })
  .post('/api/hunt/missions', async ({ body, headers, set }) => {
    const authErr = requireModToken(headers, set);
    if (authErr) return authErr;
    if (body.exampleThumbBase64 && body.exampleThumbBase64.length > PHOTO_THUMB_MAX_BYTES) {
      set.status = 413;
      return { success: false, message: 'Example thumbnail too large.' };
    }
    try {
      const result = await dbRuntime.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          // If position is omitted, append at the end.
          let position = body.position;
          if (position === undefined) {
            const max = yield* sql<{ max: number | null }>`select coalesce(max(position), 0) as max from hunt_missions`;
            position = (max[0]?.max ?? 0) + 1;
          }
          const rows = yield* sql<MissionRow>`
            insert into hunt_missions
              (position, title, description, example_thumb_base64, points, active)
            values
              (${position}, ${body.title.trim()}, ${body.description?.trim() || null},
               ${body.exampleThumbBase64 ?? null}, ${body.points}, ${body.active ?? true})
            returning id, position, title, description, example_thumb_base64, points, active, created_at
          `;
          return rows[0]!;
        }),
      );
      return { success: true, mission: result };
    } catch (error) {
      console.error('Failed to create hunt mission', error);
      return { success: false, message: 'Failed to create mission.' };
    }
  }, {
    body: t.Object({
      title: t.String({ minLength: 1, maxLength: 120 }),
      description: t.Optional(t.String({ maxLength: 300 })),
      points: t.Number({ minimum: 1, maximum: 999 }),
      position: t.Optional(t.Number()),
      active: t.Optional(t.Boolean()),
      exampleThumbBase64: t.Optional(t.String()),
    }),
  })
  .patch('/api/hunt/missions/:id', async ({ params, body, headers, set }) => {
    const authErr = requireModToken(headers, set);
    if (authErr) return authErr;
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) {
      set.status = 400;
      return { success: false, message: 'Invalid id' };
    }
    if (body.exampleThumbBase64 && body.exampleThumbBase64.length > PHOTO_THUMB_MAX_BYTES) {
      set.status = 413;
      return { success: false, message: 'Example thumbnail too large.' };
    }
    try {
      const result = await dbRuntime.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          const rows = yield* sql<MissionRow>`
            update hunt_missions set
              title = coalesce(${body.title?.trim() ?? null}, title),
              description = case when ${body.description !== undefined}::boolean then ${body.description?.trim() || null} else description end,
              points = coalesce(${body.points ?? null}, points),
              position = coalesce(${body.position ?? null}, position),
              active = coalesce(${body.active ?? null}, active),
              example_thumb_base64 = case when ${body.exampleThumbBase64 !== undefined}::boolean then ${body.exampleThumbBase64 ?? null} else example_thumb_base64 end
            where id = ${id}
            returning id, position, title, description, example_thumb_base64, points, active, created_at
          `;
          return rows[0];
        }),
      );
      if (!result) {
        set.status = 404;
        return { success: false, message: 'Mission not found.' };
      }
      return { success: true, mission: result };
    } catch (error) {
      console.error('Failed to update hunt mission', error);
      return { success: false, message: 'Failed to update mission.' };
    }
  }, {
    body: t.Object({
      title: t.Optional(t.String({ minLength: 1, maxLength: 120 })),
      description: t.Optional(t.String({ maxLength: 300 })),
      points: t.Optional(t.Number({ minimum: 1, maximum: 999 })),
      position: t.Optional(t.Number()),
      active: t.Optional(t.Boolean()),
      exampleThumbBase64: t.Optional(t.String()),
    }),
  })
  .delete('/api/hunt/missions/:id', async ({ params, headers, set }) => {
    const authErr = requireModToken(headers, set);
    if (authErr) return authErr;
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) {
      set.status = 400;
      return { success: false, message: 'Invalid id' };
    }
    try {
      const result = await dbRuntime.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          const photoCount = yield* sql<{ count: string }>`
            select count(*) as count from hunt_photos where mission_id = ${id}
          `;
          const rows = yield* sql<{ id: number }>`delete from hunt_missions where id = ${id} returning id`;
          return { row: rows[0], deletedPhotoCount: Number(photoCount[0]?.count ?? 0) };
        }),
      );
      if (!result.row) {
        set.status = 404;
        return { success: false, message: 'Mission not found.' };
      }
      return {
        success: true,
        deletedMissionId: result.row.id,
        deletedPhotoCount: result.deletedPhotoCount,
      };
    } catch (error) {
      console.error('Failed to delete hunt mission', error);
      return { success: false, message: 'Failed to delete mission.' };
    }
  })
  .post('/api/hunt/missions/reorder', async ({ body, headers, set }) => {
    const authErr = requireModToken(headers, set);
    if (authErr) return authErr;
    if (!Array.isArray(body.orderedIds) || body.orderedIds.length === 0) {
      set.status = 400;
      return { success: false, message: 'orderedIds must be a non-empty array.' };
    }
    try {
      await dbRuntime.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          // Two-step rewrite to avoid hypothetical unique-constraint conflicts:
          // bump everything to a non-overlapping range, then assign final positions.
          yield* sql`update hunt_missions set position = position + 100000`;
          for (let i = 0; i < body.orderedIds.length; i++) {
            const id = body.orderedIds[i]!;
            const newPos = i + 1;
            yield* sql`update hunt_missions set position = ${newPos} where id = ${id}`;
          }
        }),
      );
      return { success: true, count: body.orderedIds.length };
    } catch (error) {
      console.error('Failed to reorder hunt missions', error);
      return { success: false, message: 'Failed to reorder missions.' };
    }
  }, {
    body: t.Object({ orderedIds: t.Array(t.Number()) }),
  })

  // ────────────────────────────────────────────────────────────────────
  // Moderator endpoint — full reset (photos AND missions)
  // ────────────────────────────────────────────────────────────────────
  .delete('/api/hunt/all', async ({ headers, set }) => {
    const authErr = requireModToken(headers, set);
    if (authErr) return authErr;
    try {
      const counts = await dbRuntime.runPromise(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          const photos = yield* sql<{ count: string }>`
            with d as (delete from hunt_photos returning 1)
            select count(*)::text as count from d
          `;
          const missions = yield* sql<{ count: string }>`
            with d as (delete from hunt_missions returning 1)
            select count(*)::text as count from d
          `;
          return {
            deletedPhotoCount: Number(photos[0]?.count ?? 0),
            deletedMissionCount: Number(missions[0]?.count ?? 0),
          };
        }),
      );
      return { success: true, ...counts };
    } catch (error) {
      console.error('Failed to full-reset hunt', error);
      return { success: false, message: 'Failed to reset hunt data.' };
    }
  });
