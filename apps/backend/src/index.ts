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
  .post('/api/rsvp', ({ body }) => {
    // Logic to save RSVP to a database (e.g., SQLite with Drizzle/Prisma)
    console.log('Received RSVP:', body);
    return { success: true, message: 'RSVP received!' };
  }, {
    body: t.Object({
      name: t.String(),
      attending: t.Boolean(),
      guests: t.Number()
    })
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