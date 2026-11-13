CREATE TABLE `biometric_consents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`personId` int NOT NULL,
	`consentType` enum('face_verification','liveness_detection') NOT NULL,
	`status` enum('granted','revoked') NOT NULL DEFAULT 'granted',
	`purpose` varchar(180) NOT NULL,
	`policyVersion` varchar(80) NOT NULL,
	`consentTextHash` varchar(128) NOT NULL,
	`providerReference` varchar(180),
	`grantedAt` timestamp NOT NULL DEFAULT (now()),
	`revokedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `biometric_consents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `persons` ADD `faceVerificationStatus` enum('unverified','pending','verified','manual_review','suspended','expired','rejected') DEFAULT 'unverified' NOT NULL;--> statement-breakpoint
ALTER TABLE `persons` ADD `livenessStatus` enum('unverified','pending','passed','manual_review','failed','suspended','expired') DEFAULT 'unverified' NOT NULL;--> statement-breakpoint
ALTER TABLE `persons` ADD `biometricConsentStatus` enum('not_granted','granted','revoked') DEFAULT 'not_granted' NOT NULL;--> statement-breakpoint
ALTER TABLE `persons` ADD `biometricProvider` varchar(120);--> statement-breakpoint
ALTER TABLE `persons` ADD `faceVerificationReference` varchar(180);--> statement-breakpoint
ALTER TABLE `persons` ADD `livenessVerificationReference` varchar(180);--> statement-breakpoint
ALTER TABLE `persons` ADD `biometricVerifiedAt` timestamp;--> statement-breakpoint
ALTER TABLE `biometric_consents` ADD CONSTRAINT `biometric_consents_personId_persons_id_fk` FOREIGN KEY (`personId`) REFERENCES `persons`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `biometric_consents_person_idx` ON `biometric_consents` (`personId`);--> statement-breakpoint
CREATE INDEX `biometric_consents_type_status_idx` ON `biometric_consents` (`consentType`,`status`);