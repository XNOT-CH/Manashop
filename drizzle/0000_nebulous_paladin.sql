CREATE TABLE `AnnouncementPopup` (
	`id` varchar(36) NOT NULL,
	`title` varchar(255),
	`imageUrl` text NOT NULL,
	`linkUrl` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`dismissOption` varchar(30) NOT NULL DEFAULT 'show_always',
	`createdAt` datetime NOT NULL DEFAULT now(),
	`updatedAt` datetime NOT NULL DEFAULT now(),
	CONSTRAINT `AnnouncementPopup_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ApiKey` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`key` varchar(64) NOT NULL,
	`keyPrefix` varchar(8) NOT NULL,
	`userId` varchar(36) NOT NULL,
	`permissions` text,
	`expiresAt` datetime,
	`lastUsedAt` datetime,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` datetime NOT NULL DEFAULT now(),
	CONSTRAINT `ApiKey_id` PRIMARY KEY(`id`),
	CONSTRAINT `ApiKey_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `AuditLog` (
	`id` varchar(36) NOT NULL,
	`userId` varchar(36),
	`action` varchar(100) NOT NULL,
	`resource` varchar(100),
	`resourceId` varchar(36),
	`details` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`status` varchar(20) NOT NULL DEFAULT 'SUCCESS',
	`createdAt` datetime NOT NULL DEFAULT now(),
	CONSTRAINT `AuditLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `CurrencySettings` (
	`id` varchar(36) NOT NULL DEFAULT 'default',
	`name` varchar(50) NOT NULL DEFAULT 'พอยท์',
	`symbol` varchar(10) NOT NULL DEFAULT '💎',
	`code` varchar(20) NOT NULL DEFAULT 'POINT',
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`updatedAt` datetime NOT NULL DEFAULT now(),
	CONSTRAINT `CurrencySettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `FooterLink` (
	`id` varchar(36) NOT NULL,
	`label` varchar(100) NOT NULL,
	`href` varchar(500) NOT NULL,
	`openInNewTab` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` datetime NOT NULL DEFAULT now(),
	`updatedAt` datetime NOT NULL DEFAULT now(),
	CONSTRAINT `FooterLink_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `FooterWidgetSettings` (
	`id` varchar(36) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`title` varchar(100) NOT NULL DEFAULT 'เมนูลัด',
	`createdAt` datetime NOT NULL DEFAULT now(),
	`updatedAt` datetime NOT NULL DEFAULT now(),
	CONSTRAINT `FooterWidgetSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `GachaCategory` (
	`id` varchar(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` datetime NOT NULL DEFAULT now(),
	`updatedAt` datetime NOT NULL DEFAULT now(),
	CONSTRAINT `GachaCategory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `GachaMachine` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`imageUrl` text,
	`gameType` varchar(20) NOT NULL DEFAULT 'SPIN_X',
	`categoryId` varchar(36),
	`costType` varchar(20) NOT NULL DEFAULT 'FREE',
	`costAmount` decimal(10,2) NOT NULL DEFAULT '0',
	`dailySpinLimit` int NOT NULL DEFAULT 0,
	`tierMode` varchar(20) NOT NULL DEFAULT 'PRICE',
	`isActive` boolean NOT NULL DEFAULT true,
	`isEnabled` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` datetime NOT NULL DEFAULT now(),
	`updatedAt` datetime NOT NULL DEFAULT now(),
	CONSTRAINT `GachaMachine_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `GachaReward` (
	`id` varchar(36) NOT NULL,
	`rewardType` varchar(20) NOT NULL DEFAULT 'PRODUCT',
	`productId` varchar(36),
	`rewardName` varchar(255),
	`rewardAmount` decimal(10,2),
	`rewardImageUrl` text,
	`tier` varchar(20) NOT NULL DEFAULT 'common',
	`probability` decimal(6,2) NOT NULL DEFAULT '1',
	`isActive` boolean NOT NULL DEFAULT true,
	`gachaMachineId` varchar(36),
	`createdAt` datetime NOT NULL DEFAULT now(),
	`updatedAt` datetime NOT NULL DEFAULT now(),
	CONSTRAINT `GachaReward_id` PRIMARY KEY(`id`),
	CONSTRAINT `GachaReward_productId_unique` UNIQUE(`productId`)
);
--> statement-breakpoint
CREATE TABLE `GachaRollLog` (
	`id` varchar(36) NOT NULL,
	`userId` varchar(36) NOT NULL,
	`productId` varchar(36),
	`rewardName` varchar(255),
	`rewardImageUrl` text,
	`tier` varchar(20) NOT NULL,
	`selectorLabel` varchar(10),
	`costType` varchar(20) NOT NULL,
	`costAmount` decimal(10,2) NOT NULL DEFAULT '0',
	`gachaMachineId` varchar(36),
	`createdAt` datetime NOT NULL DEFAULT now(),
	CONSTRAINT `GachaRollLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `GachaSettings` (
	`id` varchar(36) NOT NULL DEFAULT 'default',
	`isEnabled` boolean NOT NULL DEFAULT true,
	`costType` varchar(20) NOT NULL DEFAULT 'FREE',
	`costAmount` decimal(10,2) NOT NULL DEFAULT '0',
	`dailySpinLimit` int NOT NULL DEFAULT 0,
	`tierMode` varchar(20) NOT NULL DEFAULT 'PRICE',
	`updatedAt` datetime NOT NULL DEFAULT now(),
	CONSTRAINT `GachaSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `HelpArticle` (
	`id` varchar(36) NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`category` varchar(50) NOT NULL DEFAULT 'general',
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` datetime NOT NULL DEFAULT now(),
	`updatedAt` datetime NOT NULL DEFAULT now(),
	CONSTRAINT `HelpArticle_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `NavItem` (
	`id` varchar(36) NOT NULL,
	`label` varchar(100) NOT NULL,
	`href` varchar(500) NOT NULL,
	`icon` varchar(50),
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` datetime NOT NULL DEFAULT now(),
	`updatedAt` datetime NOT NULL DEFAULT now(),
	CONSTRAINT `NavItem_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `NewsArticle` (
	`id` varchar(36) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`imageUrl` text,
	`link` varchar(500),
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` datetime NOT NULL DEFAULT now(),
	`updatedAt` datetime NOT NULL DEFAULT now(),
	CONSTRAINT `NewsArticle_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Order` (
	`id` varchar(36) NOT NULL,
	`userId` varchar(36) NOT NULL,
	`givenData` text,
	`totalPrice` decimal(10,2) NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'COMPLETED',
	`purchasedAt` datetime NOT NULL DEFAULT now(),
	CONSTRAINT `Order_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Product` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`price` decimal(10,2) NOT NULL,
	`discountPrice` decimal(10,2),
	`imageUrl` varchar(500),
	`category` varchar(100) NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'THB',
	`secretData` text NOT NULL,
	`stockSeparator` varchar(20) NOT NULL DEFAULT 'newline',
	`isSold` boolean NOT NULL DEFAULT false,
	`isFeatured` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`orderId` varchar(36),
	`createdAt` datetime NOT NULL DEFAULT now(),
	`updatedAt` datetime NOT NULL DEFAULT now(),
	CONSTRAINT `Product_id` PRIMARY KEY(`id`),
	CONSTRAINT `Product_orderId_unique` UNIQUE(`orderId`)
);
--> statement-breakpoint
CREATE TABLE `PromoCode` (
	`id` varchar(36) NOT NULL,
	`code` varchar(50) NOT NULL,
	`discountType` varchar(20) NOT NULL DEFAULT 'PERCENTAGE',
	`discountValue` decimal(10,2) NOT NULL,
	`minPurchase` decimal(10,2),
	`maxDiscount` decimal(10,2),
	`usageLimit` int,
	`usedCount` int NOT NULL DEFAULT 0,
	`startsAt` datetime NOT NULL DEFAULT now(),
	`expiresAt` datetime,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` datetime NOT NULL DEFAULT now(),
	`updatedAt` datetime NOT NULL DEFAULT now(),
	CONSTRAINT `PromoCode_id` PRIMARY KEY(`id`),
	CONSTRAINT `PromoCode_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `Role` (
	`id` varchar(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`code` varchar(50) NOT NULL,
	`iconUrl` text,
	`description` varchar(500),
	`permissions` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isSystem` boolean NOT NULL DEFAULT false,
	`createdAt` datetime NOT NULL DEFAULT now(),
	`updatedAt` datetime NOT NULL DEFAULT now(),
	CONSTRAINT `Role_id` PRIMARY KEY(`id`),
	CONSTRAINT `Role_name_unique` UNIQUE(`name`),
	CONSTRAINT `Role_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `Session` (
	`id` varchar(36) NOT NULL,
	`token` varchar(255) NOT NULL,
	`userId` varchar(36) NOT NULL,
	`expiresAt` datetime NOT NULL,
	`lastActivity` datetime NOT NULL DEFAULT now(),
	`userAgent` text,
	`ipAddress` varchar(45),
	`createdAt` datetime NOT NULL DEFAULT now(),
	CONSTRAINT `Session_id` PRIMARY KEY(`id`),
	CONSTRAINT `Session_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `SiteSettings` (
	`id` varchar(36) NOT NULL,
	`heroTitle` varchar(255) NOT NULL,
	`heroDescription` text NOT NULL,
	`announcement` text,
	`bannerImage1` text,
	`bannerTitle1` varchar(255),
	`bannerSubtitle1` varchar(255),
	`bannerImage2` text,
	`bannerTitle2` varchar(255),
	`bannerSubtitle2` varchar(255),
	`bannerImage3` text,
	`bannerTitle3` varchar(255),
	`bannerSubtitle3` varchar(255),
	`logoUrl` text,
	`backgroundImage` text,
	`showAllProducts` boolean NOT NULL DEFAULT true,
	`createdAt` datetime NOT NULL DEFAULT now(),
	`updatedAt` datetime NOT NULL DEFAULT now(),
	CONSTRAINT `SiteSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Topup` (
	`id` varchar(36) NOT NULL,
	`userId` varchar(36) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`proofImage` text,
	`status` varchar(20) NOT NULL DEFAULT 'PENDING',
	`transactionRef` varchar(100),
	`senderName` varchar(255),
	`senderBank` varchar(100),
	`rejectReason` varchar(500),
	`receiverName` varchar(255),
	`receiverBank` varchar(100),
	`createdAt` datetime NOT NULL DEFAULT now(),
	CONSTRAINT `Topup_id` PRIMARY KEY(`id`),
	CONSTRAINT `Topup_transactionRef_unique` UNIQUE(`transactionRef`)
);
--> statement-breakpoint
CREATE TABLE `User` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255),
	`username` varchar(255) NOT NULL,
	`email` varchar(255),
	`password` varchar(255) NOT NULL,
	`image` text,
	`role` varchar(50) NOT NULL DEFAULT 'USER',
	`permissions` text,
	`phone` varchar(20),
	`phoneVerified` boolean NOT NULL DEFAULT false,
	`emailVerified` boolean NOT NULL DEFAULT false,
	`firstName` varchar(100),
	`lastName` varchar(100),
	`firstNameEn` varchar(100),
	`lastNameEn` varchar(100),
	`taxFullName` varchar(255),
	`taxPhone` varchar(20),
	`taxAddress` text,
	`taxProvince` varchar(100),
	`taxDistrict` varchar(100),
	`taxSubdistrict` varchar(100),
	`taxPostalCode` varchar(10),
	`shipFullName` varchar(255),
	`shipPhone` varchar(20),
	`shipAddress` text,
	`shipProvince` varchar(100),
	`shipDistrict` varchar(100),
	`shipSubdistrict` varchar(100),
	`shipPostalCode` varchar(10),
	`creditBalance` decimal(10,2) NOT NULL DEFAULT '0.00',
	`pointBalance` int NOT NULL DEFAULT 0,
	`totalTopup` decimal(10,2) NOT NULL DEFAULT '0.00',
	`lifetimePoints` int NOT NULL DEFAULT 0,
	`createdAt` datetime NOT NULL DEFAULT now(),
	`updatedAt` datetime NOT NULL DEFAULT now(),
	CONSTRAINT `User_id` PRIMARY KEY(`id`),
	CONSTRAINT `User_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE INDEX `idx_apikey_prefix` ON `ApiKey` (`keyPrefix`);--> statement-breakpoint
CREATE INDEX `idx_auditlog_userId` ON `AuditLog` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_auditlog_action` ON `AuditLog` (`action`);--> statement-breakpoint
CREATE INDEX `idx_auditlog_createdAt` ON `AuditLog` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_auditlog_resource_createdAt` ON `AuditLog` (`resource`,`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_gacha_machine_categoryId` ON `GachaMachine` (`categoryId`);--> statement-breakpoint
CREATE INDEX `idx_gacha_reward_machineId` ON `GachaReward` (`gachaMachineId`);--> statement-breakpoint
CREATE INDEX `idx_gacha_roll_userId_createdAt` ON `GachaRollLog` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_gacha_roll_machineId_createdAt` ON `GachaRollLog` (`gachaMachineId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_order_userId_purchasedAt` ON `Order` (`userId`,`purchasedAt`);--> statement-breakpoint
CREATE INDEX `idx_order_status` ON `Order` (`status`);--> statement-breakpoint
CREATE INDEX `idx_order_purchasedAt` ON `Order` (`purchasedAt`);--> statement-breakpoint
CREATE INDEX `idx_product_isSold_category` ON `Product` (`isSold`,`category`);--> statement-breakpoint
CREATE INDEX `idx_product_isFeatured_isSold` ON `Product` (`isFeatured`,`isSold`);--> statement-breakpoint
CREATE INDEX `idx_product_sortOrder` ON `Product` (`sortOrder`);--> statement-breakpoint
CREATE INDEX `idx_session_userId` ON `Session` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_session_expiresAt` ON `Session` (`expiresAt`);--> statement-breakpoint
CREATE INDEX `idx_topup_userId_createdAt` ON `Topup` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_topup_status_createdAt` ON `Topup` (`status`,`createdAt`);