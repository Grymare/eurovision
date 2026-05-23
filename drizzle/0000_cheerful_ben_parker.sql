CREATE TABLE `app_meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `participants` (
	`id` text PRIMARY KEY NOT NULL,
	`party_id` text NOT NULL,
	`nickname` text NOT NULL,
	`session_token` text NOT NULL,
	`is_host` integer DEFAULT false NOT NULL,
	`has_voted` integer DEFAULT false NOT NULL,
	`joined_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`party_id`) REFERENCES `parties`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `participants_session_token_unique` ON `participants` (`session_token`);--> statement-breakpoint
CREATE UNIQUE INDEX `participants_party_nickname_unique` ON `participants` (`party_id`,`nickname`);--> statement-breakpoint
CREATE INDEX `participants_party_id_idx` ON `participants` (`party_id`);--> statement-breakpoint
CREATE TABLE `parties` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`title` text,
	`state` text DEFAULT 'draft' NOT NULL,
	`host_session_token` text NOT NULL,
	`host_participant_id` text,
	`reveal_order_json` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `parties_code_unique` ON `parties` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `parties_host_session_token_unique` ON `parties` (`host_session_token`);--> statement-breakpoint
CREATE INDEX `parties_state_idx` ON `parties` (`state`);--> statement-breakpoint
CREATE TABLE `party_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`party_id` text NOT NULL,
	`name` text NOT NULL,
	`flag_emoji` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`party_id`) REFERENCES `parties`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `party_entries_party_id_idx` ON `party_entries` (`party_id`);--> statement-breakpoint
CREATE TABLE `party_results` (
	`id` text PRIMARY KEY NOT NULL,
	`party_id` text NOT NULL,
	`scoreboard_json` text NOT NULL,
	`computed_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`party_id`) REFERENCES `parties`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `party_results_party_id_unique` ON `party_results` (`party_id`);--> statement-breakpoint
CREATE TABLE `votes` (
	`id` text PRIMARY KEY NOT NULL,
	`party_id` text NOT NULL,
	`participant_id` text NOT NULL,
	`allocations_json` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`party_id`) REFERENCES `parties`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`participant_id`) REFERENCES `participants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `votes_party_participant_unique` ON `votes` (`party_id`,`participant_id`);--> statement-breakpoint
CREATE INDEX `votes_party_id_idx` ON `votes` (`party_id`);