// src/models/rdsModel.js
console.log("🔍 ENV:", {
  host: process.env.RDS_HOST,
  user: process.env.RDS_USER,
  db: process.env.RDS_DB,
  port: process.env.RDS_PORT
});
import mysql from 'mysql2/promise';

let pool;

try {
  pool = mysql.createPool({
    host: process.env.RDS_HOST,
    user: process.env.RDS_USER,
    password: process.env.RDS_PASS,
    database: process.env.RDS_DB,
    port: process.env.RDS_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  console.log(`✅ RDS pool initialized for host: ${process.env.RDS_HOST}`);
} catch (err) {
  console.error("❌ Failed to initialize MySQL pool:", err.message);
}

// Auction-related functions
async function getAuctionsByStatus(status) {
    const query = `
        SELECT 
            id, item_name, vendor_name, vendor_email, category, min_bid, current_bid, 
            bid_count, end_time, status, images
        FROM auctions
        WHERE status = ?
    `;
    try {
        const [rows] = await pool.execute(query, [status]);
        return rows;
    } catch (err) {
        console.error("Error fetching auctions by status:", err.stack);
        throw new Error("Database query failed to retrieve auction list.");
    }
}

async function getAuctionDetails(id) {
    const query = `SELECT * FROM auctions WHERE id = ?`;
    try {
        const [rows] = await pool.execute(query, [id]);
        return rows[0];
    } catch (err) {
        console.error("Error fetching auction details:", err.stack);
        throw new Error("Database query failed to retrieve auction details.");
    }
}

async function updateAuctionStatus(id, newStatus) {
    const query = `
        UPDATE auctions
        SET status = ?, updated_at = NOW()
        WHERE id = ?
    `;
    try {
        const [result] = await pool.execute(query, [newStatus, id]);
        return result.affectedRows > 0;
    } catch (err) {
        console.error("Error updating auction status:", err.stack);
        throw new Error("Database transaction failed to update auction status.");
    }
}

async function createBid(auctionId, userId, amount) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const auctionQuery = 'SELECT current_bid, user_id FROM auctions WHERE id = ? FOR UPDATE';
        const [auctionResult] = await connection.execute(auctionQuery, [auctionId]);
        const auction = auctionResult[0];

        if (!auction) throw new Error("Auction not found.");
        if (amount <= auction.current_bid) throw new Error("Bid amount is too low.");

        const previousUserId = auction.user_id;

        await connection.execute(
            'INSERT INTO bids (auction_id, user_id, amount) VALUES (?, ?, ?)',
            [auctionId, userId, amount]
        );

        await connection.execute(
            'UPDATE auctions SET current_bid = ?, user_id = ?, bid_count = bid_count + 1, updated_at = NOW() WHERE id = ?',
            [amount, userId, auctionId]
        );

        await connection.commit();
        return { success: true, previousUserId };
    } catch (e) {
        await connection.rollback();
        console.error("Bid transaction failed:", e.stack);
        throw new Error(`Bid failed: ${e.message}`);
    } finally {
        connection.release();
    }
}

// User-related functions
async function findUserByEmail(email, role) {
    const findUserQuery = `
        SELECT id, email, password_hash AS password, name, role
        FROM users
        WHERE email = ? AND role = ?
        LIMIT 1
    `;
    try {
        console.log('Looking for user:', { email, role });
        const [rows] = await pool.execute(findUserQuery, [email, role]);
        console.log('Raw DB rows:', rows);
        console.log('Found user:', rows[0] ? 'Yes' : 'No');
        return rows[0];
    } catch (err) {
        console.error("Error finding user:", err.stack);
        throw new Error("Database query failed to find user.");
    }
}

async function createUser({ name, email, password_hash, role, contact_info = null }) {
    const createUserQuery = `
        INSERT INTO users (id, name, email, password_hash, role, contact_info, created_at, updated_at)
        VALUES (UUID(), ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;
    try {
        await pool.execute(createUserQuery, [
            name,
            email,
            password_hash,
            role,
            contact_info
        ]);

        const [users] = await pool.execute(
            'SELECT * FROM users WHERE email = ? AND role = ? LIMIT 1',
            [email, role]
        );
        return users[0];
    } catch (err) {
        console.error("Error creating user:", err.stack);
        throw new Error("Database query failed to create user.");
    }
}

// Export everything
export {
    pool,
    getAuctionsByStatus,
    getAuctionDetails,
    updateAuctionStatus,
    createBid,
    findUserByEmail,
    createUser
};