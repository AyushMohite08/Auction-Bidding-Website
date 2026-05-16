-- Move from one user row per (email, role) to one user row per email plus user_roles.
-- Run this once on an existing database before using the updated backend code.

USE auction_db;

CREATE TABLE IF NOT EXISTS `user_roles` (
  `user_id` varchar(36) NOT NULL,
  `role` enum('customer','vendor','admin') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`role`),
  KEY `role` (`role`),
  CONSTRAINT `user_roles_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TEMPORARY TABLE canonical_users AS
SELECT email, MIN(id) AS keep_id
FROM users
GROUP BY email;

-- Preserve every role, but attach it to the one surviving user row for that email.
INSERT IGNORE INTO user_roles (user_id, role)
SELECT canonical_users.keep_id, users.role
FROM users
JOIN canonical_users ON canonical_users.email = users.email;

-- Move existing auction/bid references from duplicate user ids to the surviving user id.
UPDATE auctions
JOIN users ON auctions.vendor_id = users.id
JOIN canonical_users ON canonical_users.email = users.email
SET auctions.vendor_id = canonical_users.keep_id
WHERE users.id <> canonical_users.keep_id;

UPDATE auctions
JOIN users ON auctions.winner_user_id = users.id
JOIN canonical_users ON canonical_users.email = users.email
SET auctions.winner_user_id = canonical_users.keep_id
WHERE users.id <> canonical_users.keep_id;

UPDATE bids
JOIN users ON bids.user_id = users.id
JOIN canonical_users ON canonical_users.email = users.email
SET bids.user_id = canonical_users.keep_id
WHERE users.id <> canonical_users.keep_id;

DELETE users
FROM users
JOIN canonical_users ON canonical_users.email = users.email
WHERE users.id <> canonical_users.keep_id;

ALTER TABLE users DROP INDEX email_role_unique;
ALTER TABLE users DROP COLUMN role;
ALTER TABLE users ADD UNIQUE KEY email_unique (email);

DROP TEMPORARY TABLE canonical_users;
