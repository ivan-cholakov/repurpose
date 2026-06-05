ALTER TABLE `users` ADD `google_id` text;--> statement-breakpoint
DROP INDEX "tokens_token_hash_unique";--> statement-breakpoint
DROP INDEX "users_email_unique";--> statement-breakpoint
DROP INDEX "users_stripe_customer_id_unique";--> statement-breakpoint
ALTER TABLE `users` ALTER COLUMN "password_hash" TO "password_hash" text;--> statement-breakpoint
CREATE UNIQUE INDEX `tokens_token_hash_unique` ON `tokens` (`token_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_stripe_customer_id_unique` ON `users` (`stripe_customer_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_google_id_unique` ON `users` (`google_id`);
