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

export const matchmakingSubmissions = pgTable('matchmaking_submissions', {
  id: serial('id').primaryKey(),
  submitterName: text('submitter_name').notNull(),
  friendName: text('friend_name').notNull(),
  contact: text('contact').notNull(),
  bio: text('bio'),
  photoBase64: text('photo_base64'),
  approved: boolean('approved').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type InsertMatchmakingSubmission = typeof matchmakingSubmissions.$inferInsert;
export type SelectMatchmakingSubmission = typeof matchmakingSubmissions.$inferSelect;

export const lotteryEntries = pgTable('lottery_entries', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  number: text('number').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type InsertLotteryEntry = typeof lotteryEntries.$inferInsert;
export type SelectLotteryEntry = typeof lotteryEntries.$inferSelect;

export const lotteryDraws = pgTable('lottery_draws', {
  id: serial('id').primaryKey(),
  prizeRank: integer('prize_rank').notNull().unique(),
  winningNumber: text('winning_number').notNull(),
  revealedDigits: integer('revealed_digits').notNull().default(0),
  drawnAt: timestamp('drawn_at', { withTimezone: true }).defaultNow().notNull(),
});

export type InsertLotteryDraw = typeof lotteryDraws.$inferInsert;
export type SelectLotteryDraw = typeof lotteryDraws.$inferSelect;

// Mission Hunt — photo scavenger hunt run during the reception. See
// llm-wiki/requirements/mission-hunt.md for the full spec.
export const huntMissions = pgTable('hunt_missions', {
  id: serial('id').primaryKey(),
  position: integer('position').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  exampleThumbBase64: text('example_thumb_base64'),
  points: integer('points').notNull().default(10),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type InsertHuntMission = typeof huntMissions.$inferInsert;
export type SelectHuntMission = typeof huntMissions.$inferSelect;

export const huntPhotos = pgTable('hunt_photos', {
  id: serial('id').primaryKey(),
  missionId: integer('mission_id').notNull().references(() => huntMissions.id, { onDelete: 'cascade' }),
  hunterToken: text('hunter_token').notNull(),
  hunterName: text('hunter_name').notNull(),
  hunterTable: text('hunter_table'),
  thumbBase64: text('thumb_base64').notNull(),
  fullBase64: text('full_base64').notNull(),
  approved: boolean('approved').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type InsertHuntPhoto = typeof huntPhotos.$inferInsert;
export type SelectHuntPhoto = typeof huntPhotos.$inferSelect;

export const seats = pgTable('seats', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  tableName: text('table_name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type InsertSeat = typeof seats.$inferInsert;
export type SelectSeat = typeof seats.$inferSelect;
