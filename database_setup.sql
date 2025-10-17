-- Complete Database Setup for Auction Project
-- Run this script to set up your database with all required tables and columns

CREATE DATABASE IF NOT EXISTS auction_db;
USE auction_db;

-- Create the 'users' table
CREATE TABLE IF NOT EXISTS `users` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('customer','vendor','admin') NOT NULL,
  `contact_info` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_role_unique` (`email`,`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create the 'auctions' table with all columns including locked_price
CREATE TABLE IF NOT EXISTS `auctions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vendor_id` varchar(36) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `description` text,
  `min_bid` decimal(10,2) NOT NULL,
  `current_bid` decimal(10,2) DEFAULT NULL,
  `locked_price` decimal(10,2) DEFAULT NULL,
  `image_url` varchar(2048) DEFAULT NULL,
  `status` enum('pending','approved','active','sold','expired','rejected') NOT NULL DEFAULT 'pending',
  `winner_user_id` varchar(36) DEFAULT NULL,
  `start_time` timestamp NULL DEFAULT NULL,
  `end_time` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `vendor_id` (`vendor_id`),
  KEY `winner_user_id` (`winner_user_id`),
  CONSTRAINT `auctions_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `users` (`id`),
  CONSTRAINT `auctions_winner_fk` FOREIGN KEY (`winner_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create the 'bids' table
CREATE TABLE IF NOT EXISTS `bids` (
  `id` int NOT NULL AUTO_INCREMENT,
  `auction_id` int NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `bid_amount` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `auction_id` (`auction_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `bids_ibfk_1` FOREIGN KEY (`auction_id`) REFERENCES `auctions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `bids_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- If you're upgrading an existing database, run this to add the locked_price column:
-- ALTER TABLE `auctions` ADD COLUMN IF NOT EXISTS `locked_price` DECIMAL(10,2) NULL DEFAULT NULL AFTER `current_bid`;

-- Verify tables were created
SHOW TABLES;

-- Display structure of auctions table to verify locked_price column exists
DESCRIBE auctions;
