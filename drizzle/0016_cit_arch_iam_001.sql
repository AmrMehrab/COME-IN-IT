CREATE TABLE `business_membership_permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`membershipId` int NOT NULL,
	`permissionCode` varchar(100) NOT NULL,
	`status` enum('active','revoked') NOT NULL DEFAULT 'active',
	`grantedByUserId` int,
	`grantedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	`revokedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `business_membership_permissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `business_membership_permission_unique` UNIQUE(`membershipId`,`permissionCode`)
);
--> statement-breakpoint
ALTER TABLE `business_entities` MODIFY COLUMN `ownerUserId` int;--> statement-breakpoint
ALTER TABLE `business_entities` MODIFY COLUMN `ownerPersonId` int;--> statement-breakpoint
ALTER TABLE `audit_events` ADD `businessId` int;--> statement-breakpoint
ALTER TABLE `audit_events` ADD `membershipId` int;--> statement-breakpoint
ALTER TABLE `audit_events` ADD `permissionCode` varchar(100);--> statement-breakpoint
ALTER TABLE `audit_events` ADD `decision` enum('allow','deny','manual_review');--> statement-breakpoint
ALTER TABLE `audit_events` ADD `reasonCode` varchar(120);--> statement-breakpoint
ALTER TABLE `audit_events` ADD `requestId` varchar(120);--> statement-breakpoint
ALTER TABLE `business_entities` ADD `createdByUserId` int;--> statement-breakpoint
ALTER TABLE `business_entities` ADD `createdByPersonId` int;--> statement-breakpoint
ALTER TABLE `commerce_purchase_orders` ADD `buyerBusinessId` int;--> statement-breakpoint
ALTER TABLE `business_membership_permissions` ADD CONSTRAINT `business_membership_permissions_membershipId_business_memberships_id_fk` FOREIGN KEY (`membershipId`) REFERENCES `business_memberships`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_membership_permissions` ADD CONSTRAINT `business_membership_permissions_grantedByUserId_users_id_fk` FOREIGN KEY (`grantedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `business_membership_permissions_status_idx` ON `business_membership_permissions` (`status`,`expiresAt`);--> statement-breakpoint
ALTER TABLE `business_entities` ADD CONSTRAINT `business_entities_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_entities` ADD CONSTRAINT `business_entities_createdByPersonId_persons_id_fk` FOREIGN KEY (`createdByPersonId`) REFERENCES `persons`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commerce_purchase_orders` ADD CONSTRAINT `commerce_order_buyer_business_fk` FOREIGN KEY (`buyerBusinessId`) REFERENCES `business_entities`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `audit_events_business_created_idx` ON `audit_events` (`businessId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `commerce_orders_buyer_business_idx` ON `commerce_purchase_orders` (`buyerBusinessId`);