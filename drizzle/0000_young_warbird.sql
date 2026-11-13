CREATE TABLE `audit_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorUserId` int,
	`action` varchar(120) NOT NULL,
	`resourceType` varchar(120) NOT NULL,
	`resourceId` varchar(120) NOT NULL,
	`dataClassification` enum('public','verified','restricted','confidential_sovereign') NOT NULL DEFAULT 'verified',
	`metadataJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `business_entities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerUserId` int NOT NULL,
	`legalName` varchar(255) NOT NULL,
	`tradeName` varchar(255),
	`registrationNumber` varchar(120),
	`entityType` enum('factory','importer','exporter','store','service_provider','government_entity','other') NOT NULL,
	`verificationStatus` enum('unverified','pending','verified','suspended','expired','rejected') NOT NULL DEFAULT 'unverified',
	`dataClassification` enum('public','verified','restricted','confidential_sovereign') NOT NULL DEFAULT 'restricted',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `business_entities_id` PRIMARY KEY(`id`),
	CONSTRAINT `business_entities_registration_unique` UNIQUE(`registrationNumber`)
);
--> statement-breakpoint
CREATE TABLE `business_memberships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`userId` int NOT NULL,
	`membershipRole` enum('owner','authorized_representative','operations_manager','viewer') NOT NULL,
	`status` enum('active','suspended','inactive') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `business_memberships_id` PRIMARY KEY(`id`),
	CONSTRAINT `business_memberships_business_user_unique` UNIQUE(`businessId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `specification_bookmarks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sectionId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `specification_bookmarks_id` PRIMARY KEY(`id`),
	CONSTRAINT `specification_bookmarks_user_section_unique` UNIQUE(`userId`,`sectionId`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
ALTER TABLE `audit_events` ADD CONSTRAINT `audit_events_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_entities` ADD CONSTRAINT `business_entities_ownerUserId_users_id_fk` FOREIGN KEY (`ownerUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_memberships` ADD CONSTRAINT `business_memberships_businessId_business_entities_id_fk` FOREIGN KEY (`businessId`) REFERENCES `business_entities`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_memberships` ADD CONSTRAINT `business_memberships_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `specification_bookmarks` ADD CONSTRAINT `specification_bookmarks_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `audit_events_actor_idx` ON `audit_events` (`actorUserId`);--> statement-breakpoint
CREATE INDEX `audit_events_resource_idx` ON `audit_events` (`resourceType`,`resourceId`);--> statement-breakpoint
CREATE INDEX `business_entities_owner_idx` ON `business_entities` (`ownerUserId`);--> statement-breakpoint
CREATE INDEX `business_memberships_business_idx` ON `business_memberships` (`businessId`);--> statement-breakpoint
CREATE INDEX `business_memberships_user_idx` ON `business_memberships` (`userId`);--> statement-breakpoint
CREATE INDEX `specification_bookmarks_user_idx` ON `specification_bookmarks` (`userId`);