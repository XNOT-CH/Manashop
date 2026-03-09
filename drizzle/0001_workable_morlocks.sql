ALTER TABLE `ApiKey` ADD CONSTRAINT `ApiKey_userId_User_id_fk` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_userId_User_id_fk` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `GachaMachine` ADD CONSTRAINT `GachaMachine_categoryId_GachaCategory_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `GachaCategory`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `GachaReward` ADD CONSTRAINT `GachaReward_productId_Product_id_fk` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `GachaReward` ADD CONSTRAINT `GachaReward_gachaMachineId_GachaMachine_id_fk` FOREIGN KEY (`gachaMachineId`) REFERENCES `GachaMachine`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `GachaRollLog` ADD CONSTRAINT `GachaRollLog_userId_User_id_fk` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `GachaRollLog` ADD CONSTRAINT `GachaRollLog_productId_Product_id_fk` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `GachaRollLog` ADD CONSTRAINT `GachaRollLog_gachaMachineId_GachaMachine_id_fk` FOREIGN KEY (`gachaMachineId`) REFERENCES `GachaMachine`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Order` ADD CONSTRAINT `Order_userId_User_id_fk` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Product` ADD CONSTRAINT `Product_orderId_Order_id_fk` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_User_id_fk` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Topup` ADD CONSTRAINT `Topup_userId_User_id_fk` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_promocode_isActive_expiresAt` ON `PromoCode` (`isActive`,`expiresAt`);--> statement-breakpoint
CREATE INDEX `idx_user_email` ON `User` (`email`);