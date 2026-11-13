CREATE TABLE `health_record_references` (
	`id` int AUTO_INCREMENT NOT NULL,
	`healthProfileId` int NOT NULL,
	`sourceProviderId` int,
	`submittedByUserId` int NOT NULL,
	`sourceType` enum('patient_statement','professional_encounter','laboratory_result','radiology_report','hospital_encounter','medication_dispense','medical_document') NOT NULL,
	`externalReferenceHash` varchar(180) NOT NULL,
	`integrityHash` varchar(180) NOT NULL,
	`provenanceStatus` enum('submitted','verified','rejected','superseded') NOT NULL DEFAULT 'submitted',
	`occurredAt` timestamp NOT NULL,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`lockedAt` timestamp NOT NULL DEFAULT (now()),
	`amendsRecordId` int,
	`amendmentReason` varchar(240),
	`dataClassification` enum('confidential_sovereign','highly_sensitive_health') NOT NULL DEFAULT 'highly_sensitive_health',
	CONSTRAINT `health_record_references_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `health_record_references` ADD CONSTRAINT `health_record_references_healthProfileId_health_profiles_id_fk` FOREIGN KEY (`healthProfileId`) REFERENCES `health_profiles`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `health_record_references` ADD CONSTRAINT `health_record_references_sourceProviderId_health_providers_id_fk` FOREIGN KEY (`sourceProviderId`) REFERENCES `health_providers`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `health_record_references` ADD CONSTRAINT `health_record_references_submittedByUserId_users_id_fk` FOREIGN KEY (`submittedByUserId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `health_record_references` ADD CONSTRAINT `health_record_ref_amends_fk` FOREIGN KEY (`amendsRecordId`) REFERENCES `health_record_references`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `health_record_references_profile_idx` ON `health_record_references` (`healthProfileId`);--> statement-breakpoint
CREATE INDEX `health_record_references_provider_idx` ON `health_record_references` (`sourceProviderId`);--> statement-breakpoint
CREATE INDEX `health_record_references_status_idx` ON `health_record_references` (`provenanceStatus`);--> statement-breakpoint
CREATE INDEX `health_record_references_amends_idx` ON `health_record_references` (`amendsRecordId`);
