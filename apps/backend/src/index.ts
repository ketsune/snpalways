import 'dotenv/config';
import { Elysia, t } from "elysia";
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
    allowedHeaders: ['Content-Type', 'x-mod-token'],
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
  .post('/api/rsvp', async ({ body }) => {
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
  .get('/api/rsvps', async () => {
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
  .post('/api/matchmaking', async ({ body, set }) => {
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
  .get('/api/matchmaking', async () => {
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
    const token = process.env.SECRET_SERVICE_KEY;
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
    const token = process.env.SECRET_SERVICE_KEY;
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
  .listen(3000);

// Run a connectivity check on startup and log the result
Effect.runPromise(dbHealthCheck)
  .then((ok) => {
    if (ok) console.log("✅ Database connection successful");
    else console.warn("⚠️ Database connection check returned unexpected result");
  })
  .catch((err) => console.error("❌ Database connection failed:", err));

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);