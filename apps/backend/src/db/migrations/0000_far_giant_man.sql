CREATE TABLE "rsvps" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"attending" boolean NOT NULL,
	"guests" integer DEFAULT 0 NOT NULL,
	"message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
