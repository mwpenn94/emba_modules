CREATE TABLE `challenge_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`challengeId` int NOT NULL,
	`userId` int NOT NULL,
	`score` int NOT NULL DEFAULT 0,
	`totalQuestions` int NOT NULL DEFAULT 0,
	`completedAt` timestamp,
	`timeTaken` int,
	CONSTRAINT `challenge_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `group_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`userId` int NOT NULL,
	`memberRole` enum('owner','admin','member') NOT NULL DEFAULT 'member',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `group_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quiz_challenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sharedQuizId` int NOT NULL,
	`groupId` int NOT NULL,
	`challengerId` int NOT NULL,
	`challengeStatus` enum('open','active','completed') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`endsAt` timestamp,
	CONSTRAINT `quiz_challenges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shared_quizzes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`creatorId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`discipline` varchar(255) NOT NULL,
	`difficulty` varchar(32) NOT NULL DEFAULT 'medium',
	`questionIds` json NOT NULL,
	`timeLimit` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shared_quizzes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `study_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`inviteCode` varchar(32) NOT NULL,
	`ownerId` int NOT NULL,
	`isPublic` boolean NOT NULL DEFAULT true,
	`maxMembers` int NOT NULL DEFAULT 50,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `study_groups_id` PRIMARY KEY(`id`),
	CONSTRAINT `study_groups_inviteCode_unique` UNIQUE(`inviteCode`)
);
