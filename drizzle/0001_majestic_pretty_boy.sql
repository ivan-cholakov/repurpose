ALTER TABLE `generations` ADD `source` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `generations` ADD `results` text DEFAULT '[]' NOT NULL;