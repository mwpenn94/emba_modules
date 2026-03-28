CREATE TABLE `playlist_shares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playlistId` int NOT NULL,
	`sharedWithUserId` int,
	`permission` enum('view','edit') NOT NULL DEFAULT 'view',
	`grantedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `playlist_shares_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','advisor','admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `playlists` ADD `shareToken` varchar(64);--> statement-breakpoint
ALTER TABLE `playlists` ADD CONSTRAINT `playlists_shareToken_unique` UNIQUE(`shareToken`);