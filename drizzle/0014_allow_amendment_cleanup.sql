ALTER TABLE `health_record_references` DROP FOREIGN KEY `health_record_refs_amends_fk`;
--> statement-breakpoint
ALTER TABLE `health_record_references` ADD CONSTRAINT `health_record_refs_amends_fk` FOREIGN KEY (`amendsRecordId`) REFERENCES `health_record_references`(`id`) ON DELETE set null ON UPDATE no action;