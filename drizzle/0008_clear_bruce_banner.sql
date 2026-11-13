ALTER TABLE `trade_demands` MODIFY COLUMN `requesterBusinessId` int;--> statement-breakpoint
ALTER TABLE `trade_matches` MODIFY COLUMN `status` enum('candidate','eligible','manual_review','ineligible','declined','expired') NOT NULL DEFAULT 'candidate';--> statement-breakpoint
ALTER TABLE `trade_offerings` MODIFY COLUMN `businessId` int;--> statement-breakpoint
ALTER TABLE `trade_demands` ADD `requesterIndividualProfileId` int;--> statement-breakpoint
ALTER TABLE `trade_demands` ADD `requesterKind` enum('business','individual') DEFAULT 'business' NOT NULL;--> statement-breakpoint
ALTER TABLE `trade_matches` ADD `relationshipMode` enum('b2b','b2c','c2b','c2c') DEFAULT 'b2b' NOT NULL;--> statement-breakpoint
ALTER TABLE `trade_offerings` ADD `individualProfileId` int;--> statement-breakpoint
ALTER TABLE `trade_offerings` ADD `supplierKind` enum('business','individual') DEFAULT 'business' NOT NULL;--> statement-breakpoint
ALTER TABLE `trade_demands` ADD CONSTRAINT `td_individual_profile_fk` FOREIGN KEY (`requesterIndividualProfileId`) REFERENCES `individual_activity_profiles`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trade_offerings` ADD CONSTRAINT `to_individual_profile_fk` FOREIGN KEY (`individualProfileId`) REFERENCES `individual_activity_profiles`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `trade_demands_individual_profile_idx` ON `trade_demands` (`requesterIndividualProfileId`);--> statement-breakpoint
CREATE INDEX `trade_offerings_individual_profile_idx` ON `trade_offerings` (`individualProfileId`);
