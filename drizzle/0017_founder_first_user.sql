CREATE TABLE `founder_bootstrap_records` (
	`id` int NOT NULL,
	`userId` int NOT NULL,
	`personId` int NOT NULL,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `founder_bootstrap_records_id` PRIMARY KEY(`id`),
	CONSTRAINT `founder_bootstrap_user_unique` UNIQUE(`userId`),
	CONSTRAINT `founder_bootstrap_person_unique` UNIQUE(`personId`)
);
--> statement-breakpoint
CREATE TABLE `founder_kyc_exemptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`personId` int NOT NULL,
	`scope` enum('initial_onboarding') NOT NULL,
	`actorUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `founder_kyc_exemptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `founder_kyc_exemptions_person_unique` UNIQUE(`personId`)
);
--> statement-breakpoint
CREATE TABLE `person_identity_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`personId` int NOT NULL,
	`nationalIdHmac` varchar(64) NOT NULL,
	`maskedNationalId` varchar(24) NOT NULL,
	`encryptedProfile` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `person_identity_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `person_identity_profiles_nationalIdHmac_unique` UNIQUE(`nationalIdHmac`),
	CONSTRAINT `person_identity_profiles_person_unique` UNIQUE(`personId`)
);
--> statement-breakpoint
ALTER TABLE `founder_bootstrap_records` ADD CONSTRAINT `founder_bootstrap_records_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `founder_bootstrap_records` ADD CONSTRAINT `founder_bootstrap_records_personId_persons_id_fk` FOREIGN KEY (`personId`) REFERENCES `persons`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `founder_bootstrap_records` ADD CONSTRAINT `founder_bootstrap_records_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `founder_kyc_exemptions` ADD CONSTRAINT `founder_kyc_exemptions_personId_persons_id_fk` FOREIGN KEY (`personId`) REFERENCES `persons`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `founder_kyc_exemptions` ADD CONSTRAINT `founder_kyc_exemptions_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `person_identity_profiles` ADD CONSTRAINT `person_identity_profiles_personId_persons_id_fk` FOREIGN KEY (`personId`) REFERENCES `persons`(`id`) ON DELETE restrict ON UPDATE no action;