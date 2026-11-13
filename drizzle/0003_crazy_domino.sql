CREATE TABLE `health_access_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`healthProfileId` int NOT NULL,
	`providerId` int,
	`actorUserId` int,
	`consentId` int,
	`purposeCode` varchar(80) NOT NULL,
	`requestedScopeHash` varchar(180) NOT NULL,
	`decision` enum('allowed','denied','emergency_allowed') NOT NULL,
	`denialCode` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `health_access_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `health_consents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`healthProfileId` int NOT NULL,
	`beneficiaryProviderId` int NOT NULL,
	`purposeCode` varchar(80) NOT NULL,
	`scopeJson` text NOT NULL,
	`status` enum('draft','active','revoked','expired') NOT NULL DEFAULT 'draft',
	`evidenceHash` varchar(180) NOT NULL,
	`issuedAt` timestamp,
	`expiresAt` timestamp NOT NULL,
	`revokedAt` timestamp,
	`revocationReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `health_consents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `health_emergency_access_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`healthProfileId` int NOT NULL,
	`providerId` int NOT NULL,
	`requesterUserId` int NOT NULL,
	`reasonCode` varchar(100) NOT NULL,
	`status` enum('requested','granted','expired','reviewed','rejected') NOT NULL DEFAULT 'requested',
	`grantedAt` timestamp,
	`expiresAt` timestamp,
	`reviewedByUserId` int,
	`reviewedAt` timestamp,
	`reviewNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `health_emergency_access_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `health_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`personId` int NOT NULL,
	`status` enum('active','suspended','closed') NOT NULL DEFAULT 'active',
	`healthIdentityReference` varchar(180) NOT NULL,
	`dataClassification` enum('confidential_sovereign') NOT NULL DEFAULT 'confidential_sovereign',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `health_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `health_profiles_person_unique` UNIQUE(`personId`),
	CONSTRAINT `health_profiles_reference_unique` UNIQUE(`healthIdentityReference`)
);
--> statement-breakpoint
CREATE TABLE `health_provider_roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`healthProviderId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('provider_admin','health_professional','emergency_clinician','compliance_reviewer') NOT NULL,
	`status` enum('active','suspended','inactive') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `health_provider_roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `health_provider_roles_unique` UNIQUE(`healthProviderId`,`userId`,`role`)
);
--> statement-breakpoint
CREATE TABLE `health_providers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`legalName` varchar(255) NOT NULL,
	`providerType` enum('hospital','clinic','laboratory','pharmacy','diagnostic_center','emergency_service','other') NOT NULL,
	`verificationStatus` enum('unverified','pending','verified','suspended','expired','rejected') NOT NULL DEFAULT 'unverified',
	`licenseReference` varchar(180),
	`dataClassification` enum('restricted','confidential_sovereign') NOT NULL DEFAULT 'confidential_sovereign',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `health_providers_id` PRIMARY KEY(`id`),
	CONSTRAINT `health_providers_license_unique` UNIQUE(`licenseReference`)
);
--> statement-breakpoint
ALTER TABLE `health_access_logs` ADD CONSTRAINT `health_access_logs_healthProfileId_health_profiles_id_fk` FOREIGN KEY (`healthProfileId`) REFERENCES `health_profiles`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `health_access_logs` ADD CONSTRAINT `health_access_logs_providerId_health_providers_id_fk` FOREIGN KEY (`providerId`) REFERENCES `health_providers`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `health_access_logs` ADD CONSTRAINT `health_access_logs_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `health_access_logs` ADD CONSTRAINT `health_access_logs_consentId_health_consents_id_fk` FOREIGN KEY (`consentId`) REFERENCES `health_consents`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `health_consents` ADD CONSTRAINT `health_consents_healthProfileId_health_profiles_id_fk` FOREIGN KEY (`healthProfileId`) REFERENCES `health_profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `health_consents` ADD CONSTRAINT `health_consents_beneficiaryProviderId_health_providers_id_fk` FOREIGN KEY (`beneficiaryProviderId`) REFERENCES `health_providers`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `health_emergency_access_requests` ADD CONSTRAINT `hea_hp_fk` FOREIGN KEY (`healthProfileId`) REFERENCES `health_profiles`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `health_emergency_access_requests` ADD CONSTRAINT `hea_pr_fk` FOREIGN KEY (`providerId`) REFERENCES `health_providers`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `health_emergency_access_requests` ADD CONSTRAINT `hea_rq_fk` FOREIGN KEY (`requesterUserId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `health_emergency_access_requests` ADD CONSTRAINT `hea_rv_fk` FOREIGN KEY (`reviewedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `health_profiles` ADD CONSTRAINT `hp_person_fk` FOREIGN KEY (`personId`) REFERENCES `persons`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `health_provider_roles` ADD CONSTRAINT `hpr_provider_fk` FOREIGN KEY (`healthProviderId`) REFERENCES `health_providers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `health_provider_roles` ADD CONSTRAINT `hpr_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `health_access_logs_profile_idx` ON `health_access_logs` (`healthProfileId`);--> statement-breakpoint
CREATE INDEX `health_access_logs_actor_idx` ON `health_access_logs` (`actorUserId`);--> statement-breakpoint
CREATE INDEX `health_access_logs_decision_idx` ON `health_access_logs` (`decision`);--> statement-breakpoint
CREATE INDEX `health_consents_profile_idx` ON `health_consents` (`healthProfileId`);--> statement-breakpoint
CREATE INDEX `health_consents_provider_idx` ON `health_consents` (`beneficiaryProviderId`);--> statement-breakpoint
CREATE INDEX `health_consents_status_expires_idx` ON `health_consents` (`status`,`expiresAt`);--> statement-breakpoint
CREATE INDEX `health_emergency_profile_idx` ON `health_emergency_access_requests` (`healthProfileId`);--> statement-breakpoint
CREATE INDEX `health_emergency_requester_idx` ON `health_emergency_access_requests` (`requesterUserId`);--> statement-breakpoint
CREATE INDEX `health_emergency_status_idx` ON `health_emergency_access_requests` (`status`);--> statement-breakpoint
CREATE INDEX `health_provider_roles_provider_idx` ON `health_provider_roles` (`healthProviderId`);--> statement-breakpoint
CREATE INDEX `health_provider_roles_user_idx` ON `health_provider_roles` (`userId`);--> statement-breakpoint
CREATE INDEX `health_providers_status_idx` ON `health_providers` (`verificationStatus`);
