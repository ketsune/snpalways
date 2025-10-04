import { pgTable, serial, text, boolean, integer, timestamp } from 'drizzle-orm/pg-core';

// Drizzle schema for RSVP data (PostgreSQL)
export const rsvps = pgTable('rsvps', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  attending: boolean('attending').notNull(),
  guests: integer('guests').notNull().default(0),
  message: text('message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type InsertRsvp = typeof rsvps.$inferInsert;
export type SelectRsvp = typeof rsvps.$inferSelect;
