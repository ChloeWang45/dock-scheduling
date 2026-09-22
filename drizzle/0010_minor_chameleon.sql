ALTER TABLE "users" ADD COLUMN "first_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_name" text DEFAULT '' NOT NULL;--> statement-breakpoint
UPDATE "users" SET
  "first_name" = split_part("name", ' ', 1),
  "last_name" = CASE WHEN position(' ' in "name") > 0 THEN substring("name" from position(' ' in "name") + 1) ELSE '' END;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "first_name" SET NOT NULL;
