CREATE TABLE "hunt_missions" (
	"id" serial PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"example_thumb_base64" text,
	"points" integer DEFAULT 10 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "hunt_photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"mission_id" integer NOT NULL,
	"hunter_token" text NOT NULL,
	"hunter_name" text NOT NULL,
	"hunter_table" text,
	"thumb_base64" text NOT NULL,
	"full_base64" text NOT NULL,
	"approved" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "hunt_photos" ADD CONSTRAINT "hunt_photos_mission_id_hunt_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "hunt_missions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "hunt_photos_mission_id_idx" ON "hunt_photos" ("mission_id");
CREATE INDEX IF NOT EXISTS "hunt_photos_hunter_token_idx" ON "hunt_photos" ("hunter_token");
CREATE INDEX IF NOT EXISTS "hunt_photos_created_at_idx" ON "hunt_photos" ("created_at");
