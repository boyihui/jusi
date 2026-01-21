CREATE TABLE `stock_details` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(20) NOT NULL,
	`name` varchar(100) NOT NULL,
	`industry` varchar(100),
	`hotConcept` varchar(100),
	`allConcepts` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stock_details_id` PRIMARY KEY(`id`),
	CONSTRAINT `stock_details_code_unique` UNIQUE(`code`)
);
