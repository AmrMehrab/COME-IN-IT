CREATE TABLE `trade_demands` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requesterBusinessId` int NOT NULL,
	`createdByUserId` int NOT NULL,
	`demandType` enum('product','service','used_asset') NOT NULL,
	`title` varchar(255) NOT NULL,
	`geographyJson` text,
	`requirementsJson` text NOT NULL,
	`status` enum('draft','published','matching','fulfilled','cancelled','expired') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trade_demands_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trade_matches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`demandId` int NOT NULL,
	`offeringId` int NOT NULL,
	`evaluatedByUserId` int NOT NULL,
	`score` int NOT NULL,
	`status` enum('candidate','eligible','ineligible','declined','expired') NOT NULL DEFAULT 'candidate',
	`decisionReason` varchar(500) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trade_matches_id` PRIMARY KEY(`id`),
	CONSTRAINT `trade_matches_demand_offering_unique` UNIQUE(`demandId`,`offeringId`)
);
--> statement-breakpoint
CREATE TABLE `trade_offerings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`createdByUserId` int NOT NULL,
	`offeringType` enum('product','service','used_asset') NOT NULL,
	`title` varchar(255) NOT NULL,
	`categoryCode` varchar(100),
	`descriptionJson` text,
	`dataClassification` enum('public','verified','restricted','confidential_sovereign') NOT NULL DEFAULT 'verified',
	`verificationStatus` enum('draft','pending','verified','rejected','suspended','expired') NOT NULL DEFAULT 'draft',
	`lifecycleStatus` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trade_offerings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `trade_demands` ADD CONSTRAINT `trade_demands_requesterBusinessId_business_entities_id_fk` FOREIGN KEY (`requesterBusinessId`) REFERENCES `business_entities`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trade_demands` ADD CONSTRAINT `trade_demands_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trade_matches` ADD CONSTRAINT `trade_matches_demandId_trade_demands_id_fk` FOREIGN KEY (`demandId`) REFERENCES `trade_demands`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trade_matches` ADD CONSTRAINT `trade_matches_offeringId_trade_offerings_id_fk` FOREIGN KEY (`offeringId`) REFERENCES `trade_offerings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trade_matches` ADD CONSTRAINT `trade_matches_evaluatedByUserId_users_id_fk` FOREIGN KEY (`evaluatedByUserId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trade_offerings` ADD CONSTRAINT `trade_offerings_businessId_business_entities_id_fk` FOREIGN KEY (`businessId`) REFERENCES `business_entities`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trade_offerings` ADD CONSTRAINT `trade_offerings_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `trade_demands_requester_idx` ON `trade_demands` (`requesterBusinessId`);--> statement-breakpoint
CREATE INDEX `trade_demands_creator_idx` ON `trade_demands` (`createdByUserId`);--> statement-breakpoint
CREATE INDEX `trade_demands_status_idx` ON `trade_demands` (`status`);--> statement-breakpoint
CREATE INDEX `trade_matches_demand_idx` ON `trade_matches` (`demandId`);--> statement-breakpoint
CREATE INDEX `trade_matches_offering_idx` ON `trade_matches` (`offeringId`);--> statement-breakpoint
CREATE INDEX `trade_matches_status_idx` ON `trade_matches` (`status`);--> statement-breakpoint
CREATE INDEX `trade_offerings_business_idx` ON `trade_offerings` (`businessId`);--> statement-breakpoint
CREATE INDEX `trade_offerings_creator_idx` ON `trade_offerings` (`createdByUserId`);--> statement-breakpoint
CREATE INDEX `trade_offerings_verification_idx` ON `trade_offerings` (`verificationStatus`);