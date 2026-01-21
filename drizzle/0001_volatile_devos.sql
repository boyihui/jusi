CREATE TABLE `collection_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`collectedAt` timestamp NOT NULL,
	`status` enum('success','failed','partial') NOT NULL,
	`totalRecords` int NOT NULL DEFAULT 0,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `collection_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `platforms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`code` varchar(50) NOT NULL,
	`displayOrder` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platforms_id` PRIMARY KEY(`id`),
	CONSTRAINT `platforms_name_unique` UNIQUE(`name`),
	CONSTRAINT `platforms_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `stock_rankings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`platformId` int NOT NULL,
	`stockName` varchar(100) NOT NULL,
	`ranking` int NOT NULL,
	`collectedAt` timestamp NOT NULL,
	`collectedDate` varchar(10) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stock_rankings_id` PRIMARY KEY(`id`)
);
