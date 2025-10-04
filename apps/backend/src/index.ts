import 'dotenv/config';
import { Elysia, t } from "elysia";
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
  .listen(3000);

// Run a connectivity check on startup and log the result
Effect.runPromise(dbHealthCheck)
  .then((ok) => {
    if (ok) console.log("✅ Database connection successful");
    else console.warn("⚠️ Database connection check returned unexpected result");
  })
  .catch((err) => console.error("❌ Database connection failed:", err));

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);