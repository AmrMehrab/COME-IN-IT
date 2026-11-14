ALTER TABLE `commerce_purchase_orders` ADD `supplierBusinessId` int;--> statement-breakpoint
ALTER TABLE `commerce_purchase_orders` ADD `offeringId` int;--> statement-breakpoint
ALTER TABLE `trade_offerings` ADD `unitPriceMinor` int;--> statement-breakpoint
ALTER TABLE `trade_offerings` ADD `minimumOrderQuantity` int;--> statement-breakpoint
ALTER TABLE `trade_offerings` ADD `quantityUnit` varchar(32);--> statement-breakpoint
ALTER TABLE `commerce_purchase_orders` ADD CONSTRAINT `commerce_order_supplier_fk` FOREIGN KEY (`supplierBusinessId`) REFERENCES `business_entities`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commerce_purchase_orders` ADD CONSTRAINT `commerce_order_offering_fk` FOREIGN KEY (`offeringId`) REFERENCES `trade_offerings`(`id`) ON DELETE restrict ON UPDATE no action;