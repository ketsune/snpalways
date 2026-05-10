CREATE TABLE "seats" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "table_name" text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
