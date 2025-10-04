import 'dotenv/config'; // Load .env file
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts', // Location of your Drizzle schema definitions
  out: './src/db/migrations',   // Location to save migration files
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});