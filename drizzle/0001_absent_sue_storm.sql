CREATE TABLE `persons` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `kycStatus` enum('unverified','pending','verified','suspended','expired','rejected') NOT NULL DEFAULT 'unverified',
  `dataClassification` enum('public','verified','restricted','confidential_sovereign') NOT NULL DEFAULT 'restricted',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `persons_id` PRIMARY KEY(`id`),
  CONSTRAINT `persons_user_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
INSERT INTO `persons` (`userId`)
SELECT `id` FROM `users`
ON DUPLICATE KEY UPDATE `userId` = VALUES(`userId`);
--> statement-breakpoint
ALTER TABLE `business_entities` ADD `ownerPersonId` int NULL;
--> statement-breakpoint
UPDATE `business_entities` b
INNER JOIN `persons` p ON p.`userId` = b.`ownerUserId`
SET b.`ownerPersonId` = p.`id`
WHERE b.`ownerPersonId` IS NULL;
--> statement-breakpoint
ALTER TABLE `business_entities` MODIFY `ownerPersonId` int NOT NULL;
--> statement-breakpoint
ALTER TABLE `business_memberships` ADD `personId` int NULL;
--> statement-breakpoint
UPDATE `business_memberships` m
INNER JOIN `persons` p ON p.`userId` = m.`userId`
SET m.`personId` = p.`id`
WHERE m.`personId` IS NULL;
--> statement-breakpoint
ALTER TABLE `business_memberships` MODIFY `personId` int NOT NULL;
--> statement-breakpoint
ALTER TABLE `persons` ADD CONSTRAINT `persons_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `business_entities` ADD CONSTRAINT `business_entities_ownerPersonId_persons_id_fk` FOREIGN KEY (`ownerPersonId`) REFERENCES `persons`(`id`) ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `business_memberships` ADD CONSTRAINT `business_memberships_personId_persons_id_fk` FOREIGN KEY (`personId`) REFERENCES `persons`(`id`) ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX `business_entities_owner_person_idx` ON `business_entities` (`ownerPersonId`);
--> statement-breakpoint
CREATE INDEX `business_memberships_person_idx` ON `business_memberships` (`personId`);
