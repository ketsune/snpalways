import { Config, ManagedRuntime } from "effect";
import { PgClient } from "@effect/sql-pg";

// Config for the PgClient / connection pool
const PgClientConfig = Config.all({
  host: Config.string("DATABASE_HOST"),
  port: Config.number("DATABASE_PORT").pipe(Config.withDefault(5432)),
  username: Config.string("DATABASE_USER"),
  password: Config.redacted("DATABASE_PASSWORD"),
  database: Config.string("DATABASE_NAME"),
  ssl: Config.boolean("DATABASE_SSL").pipe(Config.withDefault(true)),
  // Pool tuning — prevents stale-connection timeouts under load
  maxConnections: Config.succeed(10),          // enough for ~20 concurrent requests with buffer
  idleTimeoutMillis: Config.succeed(30_000),   // close idle connections after 30s (Render kills at 300s)
  connectionTimeoutMillis: Config.succeed(10_000), // fail fast if pool exhausted
  keepAlive: Config.succeed(true),             // TCP keepalive — detect dead connections early
});

// Layer — describes how to build the PgClient
export const LiveDatabase = PgClient.layerConfig(PgClientConfig);

// Shared runtime — built ONCE at startup, reused for every request.
// Eliminates the "new connection per Effect.runPromise" bug.
export const dbRuntime = ManagedRuntime.make(LiveDatabase);
