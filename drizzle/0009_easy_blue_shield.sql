CREATE TABLE `trade_quotations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rfqId` int NOT NULL,
	`supplierUserId` int NOT NULL,
	`quantity` int NOT NULL,
	`unitPriceMinor` int NOT NULL,
	`currencyCode` varchar(3) NOT NULL DEFAULT 'EGP',
	`leadTimeDays` int NOT NULL,
	`termsJson` text NOT NULL,
	`status` enum('submitted','countered','accepted','rejected','expired') NOT NULL DEFAULT 'submitted',
	`validUntil` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trade_quotations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trade_rfqs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matchId` int NOT NULL,
	`createdByUserId` int NOT NULL,
	`requestedQuantity` int NOT NULL,
	`quantityUnit` varchar(32) NOT NULL,
	`deliveryTermsJson` text NOT NULL,
	`paymentTermsJson` text NOT NULL,
	`status` enum('draft','open','quoted','accepted','expired','cancelled') NOT NULL DEFAULT 'open',
	`validUntil` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trade_rfqs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trade_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rfqId` int NOT NULL,
	`quotationId` int NOT NULL,
	`matchId` int NOT NULL,
	`offeringId` int NOT NULL,
	`demandId` int NOT NULL,
	`buyerBusinessId` int,
	`sellerBusinessId` int,
	`buyerIndividualProfileId` int,
	`sellerIndividualProfileId` int,
	`quantity` int NOT NULL,
	`quantityUnit` varchar(32) NOT NULL,
	`unitPriceMinor` int NOT NULL,
	`totalPriceMinor` int NOT NULL,
	`currencyCode` varchar(3) NOT NULL DEFAULT 'EGP',
	`deliveryTermsJson` text NOT NULL,
	`paymentTermsJson` text NOT NULL,
	`status` enum('accepted','processing','ready_for_pickup','in_transit','delivered','received','closed','cancelled','disputed') NOT NULL DEFAULT 'accepted',
	`paymentStatus` enum('unrecorded','cash_pending','bank_transfer_pending','credit_terms','external_recorded','settled') NOT NULL DEFAULT 'unrecorded',
	`ownerBusinessId` int,
	`ownerIndividualProfileId` int,
	`custodianBusinessId` int,
	`acceptedAt` timestamp NOT NULL DEFAULT (now()),
	`closedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trade_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transaction_deliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionId` int NOT NULL,
	`transportJobId` int NOT NULL,
	`deliveredQuantity` int NOT NULL,
	`acceptanceStatus` enum('pending','accepted_full','accepted_partial','rejected','damaged','shortage') NOT NULL DEFAULT 'pending',
	`receivedByUserId` int,
	`proofReference` varchar(180),
	`notes` text,
	`deliveredAt` timestamp,
	`receivedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transaction_deliveries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transaction_disputes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionId` int NOT NULL,
	`filedByUserId` int NOT NULL,
	`reason` varchar(500) NOT NULL,
	`status` enum('open','under_review','resolved','rejected') NOT NULL DEFAULT 'open',
	`resolution` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `transaction_disputes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transaction_evidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionId` int NOT NULL,
	`createdByUserId` int NOT NULL,
	`evidenceType` enum('quotation','agreement','proof_of_delivery','receipt','invoice','quality_certificate','other') NOT NULL,
	`reference` varchar(180) NOT NULL,
	`metadataJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transaction_evidence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transport_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionId` int NOT NULL,
	`providerBusinessId` int NOT NULL,
	`driverReference` varchar(180),
	`vehicleReference` varchar(180),
	`pickupLocationJson` text NOT NULL,
	`deliveryLocationJson` text NOT NULL,
	`status` enum('assigned','ready','picked_up','in_transit','delivered','failed','cancelled') NOT NULL DEFAULT 'assigned',
	`pickupAt` timestamp,
	`deliveryAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transport_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `trade_quotations` ADD CONSTRAINT `trade_quotations_rfqId_trade_rfqs_id_fk` FOREIGN KEY (`rfqId`) REFERENCES `trade_rfqs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trade_quotations` ADD CONSTRAINT `trade_quotations_supplierUserId_users_id_fk` FOREIGN KEY (`supplierUserId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trade_rfqs` ADD CONSTRAINT `trade_rfqs_matchId_trade_matches_id_fk` FOREIGN KEY (`matchId`) REFERENCES `trade_matches`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trade_rfqs` ADD CONSTRAINT `trade_rfqs_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trade_transactions` ADD CONSTRAINT `trade_transactions_rfqId_trade_rfqs_id_fk` FOREIGN KEY (`rfqId`) REFERENCES `trade_rfqs`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trade_transactions` ADD CONSTRAINT `trade_transactions_quotationId_trade_quotations_id_fk` FOREIGN KEY (`quotationId`) REFERENCES `trade_quotations`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trade_transactions` ADD CONSTRAINT `trade_transactions_matchId_trade_matches_id_fk` FOREIGN KEY (`matchId`) REFERENCES `trade_matches`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trade_transactions` ADD CONSTRAINT `trade_transactions_offeringId_trade_offerings_id_fk` FOREIGN KEY (`offeringId`) REFERENCES `trade_offerings`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trade_transactions` ADD CONSTRAINT `trade_transactions_demandId_trade_demands_id_fk` FOREIGN KEY (`demandId`) REFERENCES `trade_demands`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trade_transactions` ADD CONSTRAINT `trade_transactions_buyerBusinessId_business_entities_id_fk` FOREIGN KEY (`buyerBusinessId`) REFERENCES `business_entities`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trade_transactions` ADD CONSTRAINT `trade_transactions_sellerBusinessId_business_entities_id_fk` FOREIGN KEY (`sellerBusinessId`) REFERENCES `business_entities`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trade_transactions` ADD CONSTRAINT `trade_transactions_buyerIndividualProfileId_individual_activity_profiles_id_fk` FOREIGN KEY (`buyerIndividualProfileId`) REFERENCES `individual_activity_profiles`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trade_transactions` ADD CONSTRAINT `trade_transactions_sellerIndividualProfileId_individual_activity_profiles_id_fk` FOREIGN KEY (`sellerIndividualProfileId`) REFERENCES `individual_activity_profiles`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trade_transactions` ADD CONSTRAINT `trade_transactions_ownerBusinessId_business_entities_id_fk` FOREIGN KEY (`ownerBusinessId`) REFERENCES `business_entities`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trade_transactions` ADD CONSTRAINT `trade_transactions_ownerIndividualProfileId_individual_activity_profiles_id_fk` FOREIGN KEY (`ownerIndividualProfileId`) REFERENCES `individual_activity_profiles`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trade_transactions` ADD CONSTRAINT `trade_transactions_custodianBusinessId_business_entities_id_fk` FOREIGN KEY (`custodianBusinessId`) REFERENCES `business_entities`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transaction_deliveries` ADD CONSTRAINT `transaction_deliveries_transactionId_trade_transactions_id_fk` FOREIGN KEY (`transactionId`) REFERENCES `trade_transactions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transaction_deliveries` ADD CONSTRAINT `transaction_deliveries_transportJobId_transport_jobs_id_fk` FOREIGN KEY (`transportJobId`) REFERENCES `transport_jobs`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transaction_deliveries` ADD CONSTRAINT `transaction_deliveries_receivedByUserId_users_id_fk` FOREIGN KEY (`receivedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transaction_disputes` ADD CONSTRAINT `transaction_disputes_transactionId_trade_transactions_id_fk` FOREIGN KEY (`transactionId`) REFERENCES `trade_transactions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transaction_disputes` ADD CONSTRAINT `transaction_disputes_filedByUserId_users_id_fk` FOREIGN KEY (`filedByUserId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transaction_evidence` ADD CONSTRAINT `transaction_evidence_transactionId_trade_transactions_id_fk` FOREIGN KEY (`transactionId`) REFERENCES `trade_transactions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transaction_evidence` ADD CONSTRAINT `transaction_evidence_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transport_jobs` ADD CONSTRAINT `transport_jobs_transactionId_trade_transactions_id_fk` FOREIGN KEY (`transactionId`) REFERENCES `trade_transactions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transport_jobs` ADD CONSTRAINT `transport_jobs_providerBusinessId_business_entities_id_fk` FOREIGN KEY (`providerBusinessId`) REFERENCES `business_entities`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `trade_quotations_rfq_idx` ON `trade_quotations` (`rfqId`);--> statement-breakpoint
CREATE INDEX `trade_quotations_supplier_idx` ON `trade_quotations` (`supplierUserId`);--> statement-breakpoint
CREATE INDEX `trade_quotations_status_idx` ON `trade_quotations` (`status`);--> statement-breakpoint
CREATE INDEX `trade_rfqs_match_idx` ON `trade_rfqs` (`matchId`);--> statement-breakpoint
CREATE INDEX `trade_rfqs_creator_idx` ON `trade_rfqs` (`createdByUserId`);--> statement-breakpoint
CREATE INDEX `trade_rfqs_status_idx` ON `trade_rfqs` (`status`);--> statement-breakpoint
CREATE INDEX `trade_transactions_rfq_idx` ON `trade_transactions` (`rfqId`);--> statement-breakpoint
CREATE INDEX `trade_transactions_status_idx` ON `trade_transactions` (`status`);--> statement-breakpoint
CREATE INDEX `trade_transactions_buyer_idx` ON `trade_transactions` (`buyerBusinessId`);--> statement-breakpoint
CREATE INDEX `trade_transactions_seller_idx` ON `trade_transactions` (`sellerBusinessId`);--> statement-breakpoint
CREATE INDEX `transaction_deliveries_transaction_idx` ON `transaction_deliveries` (`transactionId`);--> statement-breakpoint
CREATE INDEX `transaction_deliveries_transport_idx` ON `transaction_deliveries` (`transportJobId`);--> statement-breakpoint
CREATE INDEX `transaction_disputes_transaction_idx` ON `transaction_disputes` (`transactionId`);--> statement-breakpoint
CREATE INDEX `transaction_disputes_status_idx` ON `transaction_disputes` (`status`);--> statement-breakpoint
CREATE INDEX `transaction_evidence_transaction_idx` ON `transaction_evidence` (`transactionId`);--> statement-breakpoint
CREATE INDEX `transport_jobs_transaction_idx` ON `transport_jobs` (`transactionId`);--> statement-breakpoint
CREATE INDEX `transport_jobs_provider_idx` ON `transport_jobs` (`providerBusinessId`);--> statement-breakpoint
CREATE INDEX `transport_jobs_status_idx` ON `transport_jobs` (`status`);