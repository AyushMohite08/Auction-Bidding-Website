// src/models/rdsModel.js
import mysql from 'mysql2/promise';

// Database Connection Configuration (using Environment Variables)
const pool = mysql.createPool({
    host: process.env.RDS_HOST,
    user: process.env.RDS_USER,
    password: process.env.RDS_PASS,
    database: process.env.RDS_DB,
    port: process.env.RDS_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

console.log(`RDS Model initialized: Connecting to MySQL host ${process.env.RDS_HOST}`);

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
        console.error("Error fetching auctions by status:", err);
        throw new Error("Database query failed to retrieve auction list.");
    }
}

async function getAuctionDetails(id) {
    const query = `
        SELECT * FROM auctions WHERE id = ?
    `;
    try {
        const [rows] = await pool.execute(query, [id]);
        return rows[0];
    } catch (err) {
        console.error("Error fetching auction details:", err);
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
        console.error("Error updating auction status:", err);
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
        return { success: true, previousUserId: previousUserId };

    } catch (e) {
        await connection.rollback();
        console.error("Bid transaction failed:", e.message);
        throw new Error(`Bid failed: ${e.message}`);
    } finally {
        connection.release();
    }
}

// User related functions
export async function findUserByEmail(email, role) {
    const query = `
        SELECT id, name, email, password_hash, role
        FROM users
        WHERE email = ? AND role = ?
        LIMIT 1
    `;
    try {
        const [rows] = await pool.execute(query, [email, role]);
        return rows[0];
    } catch (err) {
        console.error('Error finding user by email:', err);
        throw new Error('Database error while finding user');
    }
}

export async function createUser({ name, email, password_hash, role }) {
    const query = `
        INSERT INTO users (name, email, password_hash, role)
        VALUES (?, ?, ?, ?)
    `;
    try {
        const [result] = await pool.execute(query, [name, email, password_hash, role]);
        return {
            id: result.insertId,
            name,
            email,
            role
        };
    } catch (err) {
        console.error('Error creating user:', err);
        throw new Error('Database error while creating user');
    }
}

// Export existing functions
export {
    getAuctionsByStatus,
    getAuctionDetails,
    updateAuctionStatus,
    createBid
};