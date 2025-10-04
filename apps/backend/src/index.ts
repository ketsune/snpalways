import { Elysia, t } from "elysia";

const app = new Elysia()
  .get('/api/greeting', () => ({
    message: "Welcome to our wedding website API!"
  }))
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

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);