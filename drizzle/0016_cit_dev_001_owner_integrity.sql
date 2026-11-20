ALTER TABLE `business_entities` DROP FOREIGN KEY `business_entities_ownerPersonId_persons_id_fk`;
--> statement-breakpoint
ALTER TABLE `business_memberships` DROP FOREIGN KEY `business_memberships_personId_persons_id_fk`;
--> statement-breakpoint
ALTER TABLE `persons` ADD `founderInitialKycExemptionUsedAt` timestamp;--> statement-breakpoint
ALTER TABLE `persons` ADD CONSTRAINT `persons_id_user_unique` UNIQUE(`id`,`userId`);--> statement-breakpoint
ALTER TABLE `business_entities` ADD CONSTRAINT `business_entities_owner_person_user_fk` FOREIGN KEY (`ownerPersonId`,`ownerUserId`) REFERENCES `persons`(`id`,`userId`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_memberships` ADD CONSTRAINT `business_memberships_person_user_fk` FOREIGN KEY (`personId`,`userId`) REFERENCES `persons`(`id`,`userId`) ON DELETE restrict ON UPDATE no action;