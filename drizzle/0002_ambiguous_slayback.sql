CREATE TABLE `kyb_verifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`submittedByUserId` int NOT NULL,
	`status` enum('pending','verified','suspended','expired','rejected') NOT NULL DEFAULT 'pending',
	`providerReference` varchar(180),
	`registrationReference` varchar(180),
	`documentMetadataJson` text,
	`reviewReason` text,
	`reviewedByUserId` int,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kyb_verifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kyc_verifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`personId` int NOT NULL,
	`status` enum('pending','verified','suspended','expired','rejected') NOT NULL DEFAULT 'pending',
	`providerReference` varchar(180),
	`identityReference` varchar(180),
	`countryCode` varchar(2),
	`documentMetadataJson` text,
	`reviewReason` text,
	`reviewedByUserId` int,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kyc_verifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `kyb_verifications` ADD CONSTRAINT `kyb_verifications_businessId_business_entities_id_fk` FOREIGN KEY (`businessId`) REFERENCES `business_entities`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kyb_verifications` ADD CONSTRAINT `kyb_verifications_submittedByUserId_users_id_fk` FOREIGN KEY (`submittedByUserId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kyb_verifications` ADD CONSTRAINT `kyb_verifications_reviewedByUserId_users_id_fk` FOREIGN KEY (`reviewedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kyc_verifications` ADD CONSTRAINT `kyc_verifications_personId_persons_id_fk` FOREIGN KEY (`personId`) REFERENCES `persons`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kyc_verifications` ADD CONSTRAINT `kyc_verifications_reviewedByUserId_users_id_fk` FOREIGN KEY (`reviewedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `kyb_verifications_business_idx` ON `kyb_verifications` (`businessId`);--> statement-breakpoint
CREATE INDEX `kyb_verifications_submitter_idx` ON `kyb_verifications` (`submittedByUserId`);--> statement-breakpoint
CREATE INDEX `kyb_verifications_status_idx` ON `kyb_verifications` (`status`);--> statement-breakpoint
CREATE INDEX `kyc_verifications_person_idx` ON `kyc_verifications` (`personId`);--> statement-breakpoint
CREATE INDEX `kyc_verifications_status_idx` ON `kyc_verifications` (`status`);