CREATE TABLE `commerce_purchase_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`buyerUserId` int NOT NULL,
	`partnerKey` varchar(120) NOT NULL,
	`partnerName` varchar(255) NOT NULL,
	`productKey` varchar(120) NOT NULL,
	`productName` varchar(255) NOT NULL,
	`category` varchar(120) NOT NULL,
	`quantity` int NOT NULL,
	`quantityUnit` varchar(32) NOT NULL,
	`moq` int NOT NULL,
	`unitPriceMinor` int NOT NULL,
	`currencyCode` varchar(3) NOT NULL DEFAULT 'EGP',
	`message` text NOT NULL,
	`status` enum('draft','submitted','acknowledged','cancelled') NOT NULL DEFAULT 'submitted',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commerce_purchase_orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `commerce_purchase_orders` ADD CONSTRAINT `commerce_purchase_orders_buyerUserId_users_id_fk` FOREIGN KEY (`buyerUserId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `commerce_orders_buyer_idx` ON `commerce_purchase_orders` (`buyerUserId`);--> statement-breakpoint
CREATE INDEX `commerce_orders_partner_idx` ON `commerce_purchase_orders` (`partnerKey`);--> statement-breakpoint
CREATE INDEX `commerce_orders_status_idx` ON `commerce_purchase_orders` (`status`);