import { Config } from "effect";
import { PgClient } from "@effect/sql-pg";

// 1. Define the Config structure for the PgClient options
const PgClientConfig = Config.all({
  host: Config.string("DATABASE_HOST"),
  port: Config.number("DATABASE_PORT").pipe(Config.withDefault(5432)),
  username: Config.string("DATABASE_USER"),
  password: Config.redacted("DATABASE_PASSWORD"), // Keep password redacted as required by PgClientConfig
  database: Config.string("DATABASE_NAME"),
  // Enable SSL/TLS if required by the provider (e.g., Render). Defaults to true.
  ssl: Config.boolean("DATABASE_SSL").pipe(Config.withDefault(true)),
});

// 2. Create the Live Layer for the Effect application using PgClient.layerConfig
// PgClient.layerConfig connects the configured client and also provides the generic SqlClient
export const LiveDatabase = PgClient.layerConfig(PgClientConfig);