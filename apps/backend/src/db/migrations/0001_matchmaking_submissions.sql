CREATE TABLE "matchmaking_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"submitter_name" text NOT NULL,
	"friend_name" text NOT NULL,
	"contact" text NOT NULL,
	"bio" text,
	"photo_base64" text,
	"approved" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
