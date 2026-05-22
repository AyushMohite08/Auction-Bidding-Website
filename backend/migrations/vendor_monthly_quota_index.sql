ALTER TABLE `auctions`
ADD INDEX `idx_auctions_vendor_created_at` (`vendor_id`, `created_at`);
