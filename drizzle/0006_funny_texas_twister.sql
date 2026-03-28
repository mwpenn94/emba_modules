CREATE TABLE `discovery_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`topic` varchar(512) NOT NULL,
	`discipline` varchar(255),
	`question` text NOT NULL,
	`hint` text,
	`difficulty` varchar(32),
	`relatedTopics` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `discovery_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pending_share_invites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playlistId` int NOT NULL,
	`invitedEmail` varchar(320) NOT NULL,
	`invitePermission` enum('view','edit') NOT NULL DEFAULT 'view',
	`invitedBy` int NOT NULL,
	`inviteStatus` enum('pending','accepted','revoked') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pending_share_invites_id` PRIMARY KEY(`id`)
);
