USE auction_db;

ALTER TABLE users
  ADD COLUMN is_deleted TINYINT(1) NOT NULL DEFAULT 0 AFTER contact_info,
  ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER is_deleted;

ALTER TABLE auctions
  MODIFY COLUMN status enum('pending','approved','active','sold','expired','rejected','cancelled') NOT NULL DEFAULT 'pending',
  ADD COLUMN popcorn_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER end_time,
  ADD COLUMN popcorn_extension_minutes INT NOT NULL DEFAULT 5 AFTER popcorn_enabled,
  ADD COLUMN popcorn_trigger_seconds INT NOT NULL DEFAULT 60 AFTER popcorn_extension_minutes,
  ADD COLUMN popcorn_extended TINYINT(1) NOT NULL DEFAULT 0 AFTER popcorn_trigger_seconds,
  ADD COLUMN popcorn_notice VARCHAR(255) DEFAULT NULL AFTER popcorn_extended;

CREATE TABLE IF NOT EXISTS `auction_change_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `auction_id` int NOT NULL,
  `vendor_id` varchar(36) NOT NULL,
  `requested_changes` json NOT NULL,
  `reason` text,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `admin_id` varchar(36) DEFAULT NULL,
  `admin_note` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `auction_id` (`auction_id`),
  KEY `vendor_id` (`vendor_id`),
  KEY `admin_id` (`admin_id`),
  CONSTRAINT `auction_change_requests_auction_fk` FOREIGN KEY (`auction_id`) REFERENCES `auctions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `auction_change_requests_vendor_fk` FOREIGN KEY (`vendor_id`) REFERENCES `users` (`id`),
  CONSTRAINT `auction_change_requests_admin_fk` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `auction_audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `auction_id` int NOT NULL,
  `actor_id` varchar(36) DEFAULT NULL,
  `action` varchar(80) NOT NULL,
  `details` json DEFAULT NULL,
  `reason` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `auction_id` (`auction_id`),
  KEY `actor_id` (`actor_id`),
  CONSTRAINT `auction_audit_logs_auction_fk` FOREIGN KEY (`auction_id`) REFERENCES `auctions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `auction_audit_logs_actor_fk` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
