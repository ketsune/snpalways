CREATE TABLE "lottery_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"number" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lottery_entries_number_unique" UNIQUE("number")
);

CREATE TABLE "lottery_draws" (
	"id" serial PRIMARY KEY NOT NULL,
	"prize_rank" integer NOT NULL,
	"winning_number" text NOT NULL,
	"drawn_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lottery_draws_prize_rank_unique" UNIQUE("prize_rank")
);
