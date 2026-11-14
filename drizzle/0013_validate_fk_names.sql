ALTER TABLE `business_activity_verifications` DROP FOREIGN KEY `business_activity_verifications_businessId_business_entities_id_fk`;
--> statement-breakpoint
ALTER TABLE `health_emergency_access_requests` DROP FOREIGN KEY `health_emergency_access_requests_healthProfileId_health_profiles_id_fk`;
--> statement-breakpoint
ALTER TABLE `health_emergency_access_requests` DROP FOREIGN KEY `health_emergency_access_requests_providerId_health_providers_id_fk`;
--> statement-breakpoint
ALTER TABLE `health_record_references` DROP FOREIGN KEY `health_record_references_amendsRecordId_health_record_references_id_fk`;
--> statement-breakpoint
ALTER TABLE `trade_demands` DROP FOREIGN KEY `trade_demands_requesterIndividualProfileId_individual_activity_profiles_id_fk`;
--> statement-breakpoint
ALTER TABLE `trade_offerings` DROP FOREIGN KEY `trade_offerings_individualProfileId_individual_activity_profiles_id_fk`;
--> statement-breakpoint
ALTER TABLE `trade_transactions` DROP FOREIGN KEY `trade_transactions_buyerIndividualProfileId_individual_activity_profiles_id_fk`;
--> statement-breakpoint
ALTER TABLE `trade_transactions` DROP FOREIGN KEY `trade_transactions_sellerIndividualProfileId_individual_activity_profiles_id_fk`;
--> statement-breakpoint
ALTER TABLE `trade_transactions` DROP FOREIGN KEY `trade_transactions_ownerIndividualProfileId_individual_activity_profiles_id_fk`;
--> statement-breakpoint
ALTER TABLE `business_activity_verifications` ADD CONSTRAINT `business_activity_business_fk` FOREIGN KEY (`businessId`) REFERENCES `business_entities`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `health_emergency_access_requests` ADD CONSTRAINT `health_emergency_profile_fk` FOREIGN KEY (`healthProfileId`) REFERENCES `health_profiles`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `health_emergency_access_requests` ADD CONSTRAINT `health_emergency_provider_fk` FOREIGN KEY (`providerId`) REFERENCES `health_providers`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `health_record_references` ADD CONSTRAINT `health_record_refs_amends_fk` FOREIGN KEY (`amendsRecordId`) REFERENCES `health_record_references`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trade_demands` ADD CONSTRAINT `trade_demands_individual_fk` FOREIGN KEY (`requesterIndividualProfileId`) REFERENCES `individual_activity_profiles`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trade_offerings` ADD CONSTRAINT `trade_offerings_individual_fk` FOREIGN KEY (`individualProfileId`) REFERENCES `individual_activity_profiles`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trade_transactions` ADD CONSTRAINT `trade_tx_buyer_individual_fk` FOREIGN KEY (`buyerIndividualProfileId`) REFERENCES `individual_activity_profiles`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trade_transactions` ADD CONSTRAINT `trade_tx_seller_individual_fk` FOREIGN KEY (`sellerIndividualProfileId`) REFERENCES `individual_activity_profiles`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trade_transactions` ADD CONSTRAINT `trade_tx_owner_individual_fk` FOREIGN KEY (`ownerIndividualProfileId`) REFERENCES `individual_activity_profiles`(`id`) ON DELETE set null ON UPDATE no action;