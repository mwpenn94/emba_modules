CREATE TABLE `ai_quiz_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`discipline` varchar(255) NOT NULL,
	`topic` varchar(512),
	`difficulty` varchar(32) NOT NULL DEFAULT 'medium',
	`questionType` varchar(64) NOT NULL,
	`questionText` text NOT NULL,
	`options` json,
	`correctAnswer` text NOT NULL,
	`explanation` text,
	`sourceItemKey` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_quiz_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mastery_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`itemKey` varchar(255) NOT NULL,
	`seen` boolean NOT NULL DEFAULT false,
	`mastered` boolean NOT NULL DEFAULT false,
	`confidence` int NOT NULL DEFAULT 0,
	`reviewCount` int NOT NULL DEFAULT 0,
	`lastReviewed` bigint NOT NULL DEFAULT 0,
	`updatedAt` bigint NOT NULL DEFAULT 0,
	CONSTRAINT `mastery_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `study_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`discipline` varchar(255),
	`duration` int NOT NULL DEFAULT 0,
	`itemsStudied` int NOT NULL DEFAULT 0,
	`itemsMastered` int NOT NULL DEFAULT 0,
	`quizScore` int DEFAULT 0,
	`quizTotal` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `study_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`achievementId` varchar(128) NOT NULL,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`settingKey` varchar(128) NOT NULL,
	`settingValue` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_settings_id` PRIMARY KEY(`id`)
);
