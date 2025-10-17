-- Add locked_price column to track vendor-locked bid prices
ALTER TABLE `auctions`
ADD COLUMN `locked_price` DECIMAL(10,2) NULL DEFAULT NULL AFTER `current_bid`;
