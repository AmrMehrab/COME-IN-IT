-- COME IN IT: allow Google-first identity creation and persist OAuth session metadata.
-- Apply once to the intended TiDB environment after taking a backup.
-- This migration does not change existing KYC status, national IDs, phone values, or user IDs.

ALTER TABLE `comeinit`.`users`
  MODIFY COLUMN `phone` VARCHAR(20) NULL,
  MODIFY COLUMN `password_hash` VARCHAR(255) NULL,
  ADD COLUMN `loginMethod` VARCHAR(64) NULL,
  ADD COLUMN `role` ENUM('user', 'admin', 'owner') NOT NULL DEFAULT 'user',
  ADD COLUMN `updatedAt` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ADD COLUMN `lastSignedIn` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  ADD UNIQUE KEY `users_openId_unique` (`openId`);
