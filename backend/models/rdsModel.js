import mysql from "mysql2/promise";
import { ACTIVE_AUCTION_STATUSES, AUCTION_STATUSES } from "../constants/appConstants.js";
import { env } from "../config/env.js";

export const pool = mysql.createPool({
  host: env.db.host,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  port: env.db.port,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

console.log(`RDS pool initialized for host: ${env.db.host || "not configured"}`);

export async function withTransaction(work) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function createAuction(auctionDetails) {
  const {
    vendor_id,
    item_name,
    description,
    min_bid,
    image_url,
    start_time,
    end_time,
    popcorn_enabled = 0,
    popcorn_extension_minutes = 5,
    popcorn_trigger_seconds = 60,
  } = auctionDetails;
  const query = `
    INSERT INTO auctions (
      vendor_id, item_name, description, min_bid, image_url, status, start_time, end_time,
      popcorn_enabled, popcorn_extension_minutes, popcorn_trigger_seconds
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const [result] = await pool.execute(query, [
    vendor_id,
    item_name,
    description,
    min_bid,
    image_url,
    AUCTION_STATUSES.PENDING,
    start_time,
    end_time,
    popcorn_enabled ? 1 : 0,
    popcorn_extension_minutes,
    popcorn_trigger_seconds,
  ]);

  return { id: result.insertId, status: AUCTION_STATUSES.PENDING, ...auctionDetails };
}

export async function getAllAuctions() {
  const query = `
    SELECT a.*, u.name AS winner_name
    FROM auctions a
    LEFT JOIN users u ON a.winner_user_id = u.id
    ORDER BY a.id DESC
  `;
  const [rows] = await pool.execute(query);
  return rows;
}

export async function getActiveAuctions() {
  const query = `
    SELECT a.*, u.name AS winner_name
    FROM auctions a
    LEFT JOIN users u ON a.winner_user_id = u.id
    WHERE a.status IN (?, ?) AND a.end_time > NOW()
    ORDER BY a.id DESC
  `;
  const [rows] = await pool.execute(query, ACTIVE_AUCTION_STATUSES);
  return rows;
}

export async function getAuctionById(id) {
  const query = `
    SELECT a.*, u.name AS winner_name
    FROM auctions a
    LEFT JOIN users u ON a.winner_user_id = u.id
    WHERE a.id = ?
  `;
  const [rows] = await pool.execute(query, [id]);
  return rows[0];
}

export async function getAuctionsByVendorId(vendorId) {
  const query = `
    SELECT a.*, u.name AS winner_name
    FROM auctions a
    LEFT JOIN users u ON a.winner_user_id = u.id
    WHERE a.vendor_id = ?
    ORDER BY a.id DESC
  `;
  const [rows] = await pool.execute(query, [vendorId]);
  return rows;
}

export async function countVendorAuctionsCreatedThisMonth(vendorId) {
  const query = `
    SELECT COUNT(*) AS count
    FROM auctions
    WHERE vendor_id = ?
      AND created_at >= DATE_FORMAT(CURRENT_DATE(), '%Y-%m-01')
      AND created_at < DATE_ADD(DATE_FORMAT(CURRENT_DATE(), '%Y-%m-01'), INTERVAL 1 MONTH)
  `;
  const [rows] = await pool.execute(query, [vendorId]);
  return Number(rows[0]?.count || 0);
}

export async function findUserByEmail(email, role = null) {
  const params = [email];
  const roleFilter = role ? "AND ur.role = ?" : "";
  if (role) params.push(role);

  const query = `
    SELECT u.id, u.email, u.password_hash, u.name, u.contact_info, u.is_deleted, ur.role
    FROM users u
    ${role ? "INNER" : "LEFT"} JOIN user_roles ur ON ur.user_id = u.id
    WHERE u.email = ?
    AND u.is_deleted = 0
    ${roleFilter}
    LIMIT 1
  `;
  const [rows] = await pool.execute(query, params);
  return rows[0];
}

export async function findUserById(id) {
  const query = `
    SELECT id, email, name, contact_info, is_deleted
    FROM users
    WHERE id = ?
    LIMIT 1
  `;
  const [rows] = await pool.execute(query, [id]);
  return rows[0];
}

export async function updateUserProfile(userId, { name, contact_info }) {
  const updates = [];
  const values = [];

  if (name !== undefined) {
    updates.push("name = ?");
    values.push(name);
  }
  if (contact_info !== undefined) {
    updates.push("contact_info = ?");
    values.push(contact_info);
  }
  if (updates.length === 0) return findUserById(userId);

  values.push(userId);
  await pool.execute(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, values);
  return findUserById(userId);
}

export async function softDeleteUser(userId) {
  await pool.execute(
    `
      UPDATE users
      SET name = 'Deleted User',
          email = CONCAT('deleted+', id, '@deleted.local'),
          contact_info = NULL,
          is_deleted = 1,
          deleted_at = NOW()
      WHERE id = ?
    `,
    [userId]
  );
}

export async function hasUnresolvedVendorAuctions(userId) {
  const [rows] = await pool.execute(
    "SELECT 1 FROM auctions WHERE vendor_id = ? AND status IN (?, ?, ?) LIMIT 1",
    [userId, AUCTION_STATUSES.PENDING, AUCTION_STATUSES.APPROVED, AUCTION_STATUSES.ACTIVE]
  );
  return rows.length > 0;
}

export async function isHighestBidderOnActiveAuction(userId) {
  const [rows] = await pool.execute(
    `
      SELECT 1
      FROM auctions a
      JOIN (
        SELECT auction_id, user_id, bid_amount,
               ROW_NUMBER() OVER (PARTITION BY auction_id ORDER BY bid_amount DESC, created_at ASC) AS rn
        FROM bids
      ) highest_bid ON highest_bid.auction_id = a.id AND highest_bid.rn = 1
      WHERE highest_bid.user_id = ?
        AND a.status IN (?, ?)
        AND a.end_time > NOW()
      LIMIT 1
    `,
    [userId, AUCTION_STATUSES.ACTIVE, AUCTION_STATUSES.APPROVED]
  );
  return rows.length > 0;
}

export async function getUserRoles(userId) {
  const [rows] = await pool.execute("SELECT role FROM user_roles WHERE user_id = ? ORDER BY role", [userId]);
  return rows.map((row) => row.role);
}

export async function userHasRole(userId, role) {
  const [rows] = await pool.execute("SELECT 1 FROM user_roles WHERE user_id = ? AND role = ? LIMIT 1", [
    userId,
    role,
  ]);
  return rows.length > 0;
}

export async function addUserRole(userId, role) {
  await pool.execute("INSERT IGNORE INTO user_roles (user_id, role) VALUES (?, ?)", [userId, role]);
}

export async function createUser({ name, email, password_hash }) {
  const insertQuery = `
    INSERT INTO users (id, name, email, password_hash)
    VALUES (UUID(), ?, ?, ?)
  `;

  await pool.execute(insertQuery, [name, email, password_hash]);
  const [users] = await pool.execute(
    "SELECT id, name, email, password_hash FROM users WHERE email = ? LIMIT 1",
    [email]
  );
  return users[0];
}

export async function updateUserPasswordHash(userId, passwordHash) {
  const [result] = await pool.execute("UPDATE users SET password_hash = ? WHERE id = ?", [passwordHash, userId]);
  return result.affectedRows;
}

export async function countBidsByAuctionId(auctionId) {
  const [rows] = await pool.execute("SELECT COUNT(*) AS count FROM bids WHERE auction_id = ?", [auctionId]);
  return Number(rows[0]?.count || 0);
}

export async function addAuctionAuditLog({ auctionId, actorId, action, details = null, reason = null }) {
  await pool.execute(
    "INSERT INTO auction_audit_logs (auction_id, actor_id, action, details, reason) VALUES (?, ?, ?, ?, ?)",
    [auctionId, actorId, action, details ? JSON.stringify(details) : null, reason]
  );
}

export async function updateAuctionFields(auctionId, updates) {
  const allowedFields = [
    "item_name",
    "description",
    "min_bid",
    "image_url",
    "start_time",
    "end_time",
    "popcorn_enabled",
    "popcorn_extension_minutes",
    "popcorn_trigger_seconds",
  ];
  const fields = Object.keys(updates).filter((field) => allowedFields.includes(field));
  if (fields.length === 0) return getAuctionById(auctionId);

  const setClause = fields.map((field) => `${field} = ?`).join(", ");
  const values = fields.map((field) => updates[field]);
  values.push(auctionId);

  await pool.execute(`UPDATE auctions SET ${setClause} WHERE id = ?`, values);
  return getAuctionById(auctionId);
}

export async function createBid(auctionId, userId, amount) {
  return withTransaction(async (connection) => {
    const [auctionRows] = await connection.execute("SELECT * FROM auctions WHERE id = ? FOR UPDATE", [auctionId]);
    const auction = auctionRows[0];

    if (!auction) throw new Error("Auction not found.");
    if (!ACTIVE_AUCTION_STATUSES.includes(auction.status)) throw new Error("This auction is not active.");
    if (new Date(auction.start_time) > new Date()) throw new Error("This auction has not started yet.");
    if (new Date(auction.end_time) <= new Date()) throw new Error("This auction has already ended.");
    if (auction.locked_price !== null || auction.status === AUCTION_STATUSES.SOLD) {
      throw new Error("This auction has been locked by the vendor.");
    }

    const currentPrice = Number(auction.current_bid || auction.min_bid);
    if (Number(amount) <= currentPrice) {
      throw new Error("Bid amount must be higher than the current price.");
    }

    const [previousBidders] = await connection.execute(
      "SELECT user_id FROM bids WHERE auction_id = ? ORDER BY bid_amount DESC, created_at ASC LIMIT 1",
      [auctionId]
    );
    const previousUserId = previousBidders[0]?.user_id || null;

    await connection.execute("INSERT INTO bids (auction_id, user_id, bid_amount) VALUES (?, ?, ?)", [
      auctionId,
      userId,
      amount,
    ]);

    let popcornExtended = false;
    let popcornNotice = null;
    let newEndTime = null;
    const millisecondsLeft = new Date(auction.end_time).getTime() - Date.now();
    const triggerMilliseconds = Number(auction.popcorn_trigger_seconds || 60) * 1000;

    if (
      auction.popcorn_enabled &&
      !auction.popcorn_extended &&
      millisecondsLeft > 0 &&
      millisecondsLeft <= triggerMilliseconds
    ) {
      const extensionMinutes = Number(auction.popcorn_extension_minutes || 5);
      newEndTime = new Date(new Date(auction.end_time).getTime() + extensionMinutes * 60 * 1000);
      popcornNotice = `Time extended by ${extensionMinutes} minutes due to last-minute bidding.`;
      popcornExtended = true;
    }

    if (popcornExtended) {
      await connection.execute(
        "UPDATE auctions SET current_bid = ?, end_time = ?, popcorn_extended = 1, popcorn_notice = ? WHERE id = ?",
        [amount, newEndTime, popcornNotice, auctionId]
      );
    } else {
      await connection.execute("UPDATE auctions SET current_bid = ? WHERE id = ?", [amount, auctionId]);
    }

    return {
      success: true,
      previousUserId,
      popcornExtended,
      popcornNotice,
      newEndTime,
    };
  });
}

export async function deleteAuctionById(auctionId, vendorId) {
  return withTransaction(async (connection) => {
    const [auctions] = await connection.execute("SELECT status FROM auctions WHERE id = ? AND vendor_id = ?", [
      auctionId,
      vendorId,
    ]);

    if (auctions.length === 0) {
      throw new Error("Auction not found or you don't have permission.");
    }

    if (![AUCTION_STATUSES.PENDING, AUCTION_STATUSES.REJECTED].includes(auctions[0].status)) {
      throw new Error("Cannot delete an active or completed auction.");
    }

    const [result] = await connection.execute("UPDATE auctions SET status = ? WHERE id = ? AND vendor_id = ?", [
      AUCTION_STATUSES.CANCELLED,
      auctionId,
      vendorId,
    ]);
    return result.affectedRows;
  });
}

export async function getBidsByAuctionId(auctionId) {
  const query = `
    SELECT b.bid_amount, b.created_at, u.name AS bidder_name
    FROM bids b
    JOIN users u ON b.user_id = u.id
    WHERE b.auction_id = ?
    ORDER BY b.bid_amount DESC, b.created_at ASC
  `;
  const [rows] = await pool.execute(query, [auctionId]);
  return rows;
}

export async function lockAuction(auctionId, vendorId) {
  return withTransaction(async (connection) => {
    const [auctions] = await connection.execute("SELECT * FROM auctions WHERE id = ? AND vendor_id = ? FOR UPDATE", [
      auctionId,
      vendorId,
    ]);
    const auction = auctions[0];

    if (!auction) throw new Error("Auction not found or you are not the owner.");
    if (auction.status === AUCTION_STATUSES.SOLD) throw new Error("This auction is already locked.");
    if (!ACTIVE_AUCTION_STATUSES.includes(auction.status)) throw new Error("Only active auctions can be locked.");

    const [bids] = await connection.execute(
      "SELECT user_id, bid_amount FROM bids WHERE auction_id = ? ORDER BY bid_amount DESC, created_at ASC LIMIT 1",
      [auctionId]
    );
    const winner = bids[0];
    if (!winner) throw new Error("Cannot lock an auction with no bids.");

    await connection.execute(
      "UPDATE auctions SET status = ?, winner_user_id = ?, locked_price = ? WHERE id = ?",
      [AUCTION_STATUSES.SOLD, winner.user_id, winner.bid_amount, auctionId]
    );

    return { success: true, winnerId: winner.user_id, finalPrice: winner.bid_amount };
  });
}

export async function updateAuctionStatus(auctionId, newStatus) {
  const [result] = await pool.execute("UPDATE auctions SET status = ? WHERE id = ?", [newStatus, auctionId]);
  return result.affectedRows;
}

export async function createAuctionChangeRequest({ auctionId, vendorId, requestedChanges, reason }) {
  const [result] = await pool.execute(
    `
      INSERT INTO auction_change_requests (auction_id, vendor_id, requested_changes, reason)
      VALUES (?, ?, ?, ?)
    `,
    [auctionId, vendorId, JSON.stringify(requestedChanges), reason || null]
  );
  return getAuctionChangeRequestById(result.insertId);
}

export async function getAuctionChangeRequestById(id) {
  const [rows] = await pool.execute(
    `
      SELECT acr.*, a.item_name, v.name AS vendor_name, admin.name AS admin_name
      FROM auction_change_requests acr
      JOIN auctions a ON acr.auction_id = a.id
      JOIN users v ON acr.vendor_id = v.id
      LEFT JOIN users admin ON acr.admin_id = admin.id
      WHERE acr.id = ?
      LIMIT 1
    `,
    [id]
  );
  return rows[0];
}

export async function getVendorAuctionChangeRequests(vendorId) {
  const [rows] = await pool.execute(
    `
      SELECT acr.*, a.item_name, admin.name AS admin_name
      FROM auction_change_requests acr
      JOIN auctions a ON acr.auction_id = a.id
      LEFT JOIN users admin ON acr.admin_id = admin.id
      WHERE acr.vendor_id = ?
      ORDER BY acr.created_at DESC
    `,
    [vendorId]
  );
  return rows;
}

export async function getAllAuctionChangeRequests() {
  const [rows] = await pool.execute(
    `
      SELECT acr.*, a.item_name, v.name AS vendor_name, admin.name AS admin_name
      FROM auction_change_requests acr
      JOIN auctions a ON acr.auction_id = a.id
      JOIN users v ON acr.vendor_id = v.id
      LEFT JOIN users admin ON acr.admin_id = admin.id
      ORDER BY acr.created_at DESC
    `
  );
  return rows;
}

export async function updateAuctionChangeRequestStatus({ requestId, status, adminId, adminNote }) {
  await pool.execute(
    `
      UPDATE auction_change_requests
      SET status = ?, admin_id = ?, admin_note = ?
      WHERE id = ?
    `,
    [status, adminId, adminNote || null, requestId]
  );
  return getAuctionChangeRequestById(requestId);
}

export async function expireAuctions() {
  return withTransaction(async (connection) => {
    const [expiredAuctions] = await connection.execute(
      `
        SELECT id
        FROM auctions
        WHERE status IN (?, ?) AND end_time < NOW()
        FOR UPDATE
      `,
      ACTIVE_AUCTION_STATUSES
    );
    const changes = [];

    for (const auction of expiredAuctions) {
      const [bids] = await connection.execute(
        `
          SELECT user_id, bid_amount
          FROM bids
          WHERE auction_id = ?
          ORDER BY bid_amount DESC, created_at ASC
          LIMIT 1
        `,
        [auction.id]
      );

      if (bids.length > 0) {
        const winner = bids[0];
        await connection.execute(
          "UPDATE auctions SET status = ?, winner_user_id = ?, locked_price = ? WHERE id = ?",
          [AUCTION_STATUSES.SOLD, winner.user_id, winner.bid_amount, auction.id]
        );
        changes.push({ auctionId: auction.id, status: AUCTION_STATUSES.SOLD });
      } else {
        await connection.execute("UPDATE auctions SET status = ? WHERE id = ?", [
          AUCTION_STATUSES.EXPIRED,
          auction.id,
        ]);
        changes.push({ auctionId: auction.id, status: AUCTION_STATUSES.EXPIRED });
      }
    }

    return { processed: expiredAuctions.length, changes };
  });
}

export async function getCustomerBidHistory(customerId) {
  const query = `
    SELECT
      b.id AS bid_id,
      b.bid_amount,
      b.created_at AS bid_time,
      a.id AS auction_id,
      a.item_name,
      a.description,
      a.image_url,
      a.min_bid,
      a.current_bid,
      a.locked_price,
      a.status,
      a.end_time,
      a.winner_user_id,
      v.name AS vendor_name,
      (SELECT MAX(b2.bid_amount) FROM bids b2 WHERE b2.auction_id = a.id) AS highest_bid,
      (b.bid_amount = (SELECT MAX(b3.bid_amount) FROM bids b3 WHERE b3.auction_id = a.id)) AS is_highest_bid
    FROM bids b
    INNER JOIN auctions a ON b.auction_id = a.id
    INNER JOIN users v ON a.vendor_id = v.id
    WHERE b.user_id = ?
    ORDER BY b.created_at DESC
  `;
  const [rows] = await pool.execute(query, [customerId]);
  return rows;
}

export async function getCustomerWins(customerId) {
  const query = `
    SELECT
      a.id AS auction_id,
      a.item_name,
      a.description,
      a.image_url,
      a.locked_price,
      a.current_bid,
      a.end_time,
      a.status,
      v.name AS vendor_name,
      v.email AS vendor_email,
      (
        SELECT bid_amount
        FROM bids
        WHERE auction_id = a.id AND user_id = ?
        ORDER BY bid_amount DESC
        LIMIT 1
      ) AS my_winning_bid
    FROM auctions a
    INNER JOIN users v ON a.vendor_id = v.id
    WHERE a.winner_user_id = ? AND a.status = ?
    ORDER BY a.end_time DESC
  `;
  const [rows] = await pool.execute(query, [customerId, customerId, AUCTION_STATUSES.SOLD]);
  return rows;
}

export async function getCustomerStats(customerId) {
  const query = `
    SELECT
      COUNT(DISTINCT b.auction_id) AS total_auctions_participated,
      COUNT(DISTINCT b.id) AS total_bids_placed,
      (SELECT COUNT(*) FROM auctions WHERE winner_user_id = ? AND status = ?) AS total_wins
    FROM bids b
    WHERE b.user_id = ?
  `;
  const [rows] = await pool.execute(query, [customerId, AUCTION_STATUSES.SOLD, customerId]);
  return rows[0] || {
    total_auctions_participated: 0,
    total_bids_placed: 0,
    total_wins: 0,
  };
}
