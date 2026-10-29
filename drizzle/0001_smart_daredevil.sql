CREATE TABLE "pattern_unlocks" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"pattern_hash" text NOT NULL,
	"provider" text NOT NULL,
	"provider_payment_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pattern_unlocks" ADD CONSTRAINT "pattern_unlocks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pattern_unlocks_user_hash_key" ON "pattern_unlocks" USING btree ("user_id","pattern_hash");--> statement-breakpoint
CREATE INDEX "pattern_unlocks_user_idx" ON "pattern_unlocks" USING btree ("user_id");