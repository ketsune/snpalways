// Idempotent seeder for the Mission Hunt default mission list.
// Run via: bun run src/db/seed-hunt.ts
//
// Inserts the 12 default missions only if the table is empty. Re-running on
// a non-empty table is a no-op so it's safe to call from CI or post-deploy.

import 'dotenv/config';
import { Effect } from 'effect';
import { SqlClient } from '@effect/sql';
import { LiveDatabase } from './index';

type SeedMission = {
  position: number;
  title: string;
  description: string | null;
  points: number;
};

const DEFAULT_MISSIONS: SeedMission[] = [
  { position: 1, title: 'Selfie with the bride', description: 'A clear shot of your face and Pann\'s', points: 10 },
  { position: 2, title: 'Selfie with the groom', description: 'A clear shot of your face and Som\'s', points: 10 },
  { position: 3, title: 'The wedding cake', description: 'Capture the cake before it gets cut', points: 10 },
  { position: 4, title: 'Your dinner plate', description: 'Show us what you\'re eating tonight', points: 10 },
  { position: 5, title: 'Your table number / centerpiece', description: 'Whatever\'s in front of you on the table', points: 10 },
  { position: 6, title: 'Group photo with at least 5 people', description: 'The more, the merrier', points: 15 },
  { position: 7, title: 'The most stylish auntie', description: 'You know the one', points: 15 },
  { position: 8, title: 'Two strangers who just met', description: 'Bonus if they\'re laughing', points: 20 },
  { position: 9, title: 'A kid on the dance floor', description: 'Free-form movement strongly encouraged', points: 20 },
  { position: 10, title: 'Someone crying happy tears', description: 'Be tasteful — happy tears only', points: 20 },
  { position: 11, title: 'Recreate one of Som & Pann\'s pre-wedding photos', description: 'Use the gallery for reference', points: 25 },
  { position: 12, title: 'Best dance move (action shot)', description: 'Catch them mid-air if you can', points: 25 },
];

async function main() {
  const result = await Effect.runPromise(
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      const existing = yield* sql<{ count: string }>`select count(*) as count from hunt_missions`;
      const count = Number(existing[0]?.count ?? 0);
      if (count > 0) {
        return { skipped: true, count };
      }
      for (const m of DEFAULT_MISSIONS) {
        yield* sql`
          insert into hunt_missions (position, title, description, points, active)
          values (${m.position}, ${m.title}, ${m.description}, ${m.points}, true)
        `;
      }
      return { skipped: false, count: DEFAULT_MISSIONS.length };
    }).pipe(Effect.provide(LiveDatabase)),
  );
  if (result.skipped) {
    console.log(`✋ hunt_missions already has ${result.count} rows — seed skipped.`);
  } else {
    console.log(`✅ Seeded ${result.count} default missions into hunt_missions.`);
  }
}

main().catch((err) => {
  console.error('Failed to seed hunt missions:', err);
  process.exit(1);
});
