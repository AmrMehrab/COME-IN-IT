CREATE TABLE `business_activity_verifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`activityType` enum('factory','importer','exporter','store','service_provider') NOT NULL,
	`verificationStatus` enum('unverified','pending','verified','suspended','expired','rejected') NOT NULL DEFAULT 'unverified',
	`evidenceReference` varchar(180),
	`reviewedByUserId` int,
	`reviewedAt` timestamp,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `business_activity_verifications_id` PRIMARY KEY(`id`),
	CONSTRAINT `business_activity_business_type_unique` UNIQUE(`businessId`,`activityType`)
);
--> statement-breakpoint
CREATE TABLE `individual_activity_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`personId` int NOT NULL,
	`activityType` enum('consumer','individual_producer','used_asset_seller','service_provider') NOT NULL,
	`verificationStatus` enum('unverified','pending','verified','suspended','expired','rejected') NOT NULL DEFAULT 'unverified',
	`capabilitiesJson` text,
	`evidenceReference` varchar(180),
	`dataClassification` enum('public','verified','restricted') NOT NULL DEFAULT 'verified',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `individual_activity_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `individual_activity_person_type_unique` UNIQUE(`personId`,`activityType`)
);
--> statement-breakpoint
ALTER TABLE `business_activity_verifications` ADD CONSTRAINT `bav_business_fk` FOREIGN KEY (`businessId`) REFERENCES `business_entities`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_activity_verifications` ADD CONSTRAINT `bav_reviewer_fk` FOREIGN KEY (`reviewedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `individual_activity_profiles` ADD CONSTRAINT `iap_person_fk` FOREIGN KEY (`personId`) REFERENCES `persons`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `business_activity_status_idx` ON `business_activity_verifications` (`verificationStatus`);--> statement-breakpoint
CREATE INDEX `individual_activity_status_idx` ON `individual_activity_profiles` (`verificationStatus`);
