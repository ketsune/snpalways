import 'dotenv/config';
import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { Effect } from 'effect';
import { SqlClient } from '@effect/sql';
import { LiveDatabase } from './db';
import { rsvpRoutes } from './routes/rsvp';
import { matchmakingRoutes } from './routes/matchmaking';
import { lotteryRoutes } from './routes/lottery';

const dbHealthCheck = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;
  const rows = yield* sql<{ ok: number }>`select 1 as ok`;
  return rows?.[0]?.ok === 1;
}).pipe(Effect.provide(LiveDatabase));

const app = new Elysia()
  .use(cors({
    origin: process.env.CORS_ORIGIN || true,
    allowedHeaders: ['Content-Type', 'x-mod-token', 'x-service-key'],
  }))
  .get('/api/greeting', () => ({ message: 'Welcome to our wedding website API!' }))
  .get('/api/health/db', async () => {
    try {
      const ok = await Effect.runPromise(dbHealthCheck);
      return ok
        ? { status: 'ok', message: 'Database connection successful' }
        : { status: 'degraded', message: 'Database check did not return expected result' };
    } catch (error) {
      console.error('Database healthcheck failed:', error);
      return { status: 'error', message: 'Database connection failed' };
    }
  })
  .use(rsvpRoutes)
  .use(matchmakingRoutes)
  .use(lotteryRoutes)
  .listen(3000);

Effect.runPromise(dbHealthCheck)
  .then((ok) => {
    if (ok) console.log('✅ Database connection successful');
    else console.warn('⚠️ Database connection check returned unexpected result');
  })
  .catch((err) => console.error('❌ Database connection failed:', err));

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
