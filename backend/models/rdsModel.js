// backend/models/rdsModel.js
import dotenv from 'dotenv';
dotenv.config();

import mysql from 'mysql2/promise';

console.log("🔍 ENV:", {
  host: process.env.RDS_HOST,
  user: process.env.RDS_USER,
  db: process.env.RDS_DB,
  port: process.env.RDS_PORT
});

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
} catch (err)
 {
  console.error("❌ Failed to initialize MySQL pool:", err.message);
}

// --- All functions are defined without the 'export' keyword here ---

async function createAuction(auctionDetails) {
  const { vendor_id, item_name, description, min_bid, image_url, start_time, end_time } = auctionDetails;
  const query = `
    INSERT INTO auctions (vendor_id, item_name, description, min_bid, image_url, status, start_time, end_time)
    VALUES (?, ?, ?, ?, ?, 'active', ?, ?)  -- CHANGED 'pending' to 'active'
  `;
  try {
    const [result] = await pool.execute(query, [vendor_id, item_name, description, min_bid, image_url, start_time, end_time]);
    return { id: result.insertId, ...auctionDetails };
  } catch (err) {
    console.error("Error creating auction:", err.stack);
    throw new Error("Database query failed to create auction.");
  }
}

async function getAllAuctions() {
    const query = `
        SELECT a.*, u.name as winner_name 
        FROM auctions a 
        LEFT JOIN users u ON a.winner_user_id = u.id 
        ORDER BY a.id DESC`;
    try {
        const [rows] = await pool.execute(query);
        return rows;
    } catch (err) { throw new Error("Database query failed to get auctions."); }
}

async function findUserByEmail(email, role) {
    const findUserQuery = `
        SELECT id, email, password_hash, name, role
        FROM users
        WHERE email = ? AND role = ?
        LIMIT 1
    `;
    try {
        const [rows] = await pool.execute(findUserQuery, [email, role]);
        return rows[0];
    } catch (err) {
        console.error("Error finding user:", err.stack);
        throw new Error("Database query failed to find user.");
    }
}

async function createUser({ name, email, password_hash, role }) {
    const createUserQuery = `
        INSERT INTO users (id, name, email, password_hash, role)
        VALUES (UUID(), ?, ?, ?, ?)
    `;
    try {
        await pool.execute(createUserQuery, [name, email, password_hash, role]);
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

async function createBid(auctionId, userId, amount) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const auctionQuery = 'SELECT * FROM auctions WHERE id = ? FOR UPDATE';
        const [auctionResult] = await connection.execute(auctionQuery, [auctionId]);
        const auction = auctionResult[0];

        if (!auction) throw new Error("Auction not found.");
        if (auction.status !== 'approved' && auction.status !== 'active') throw new Error("This auction is not active.");
        
        // Check if auction has ended or is locked
        const currentTime = new Date();
        const endTime = new Date(auction.end_time);
        if (endTime < currentTime) throw new Error("This auction has already ended.");
        if (auction.status === 'sold' || auction.locked_price !== null) throw new Error("This auction has been locked by the vendor.");
        
        if (amount <= (auction.current_bid || auction.min_bid)) throw new Error("Bid amount must be higher than the current price.");

        const previousBidderQuery = 'SELECT user_id FROM bids WHERE auction_id = ? ORDER BY created_at DESC LIMIT 1';
        const [previousBidders] = await connection.execute(previousBidderQuery, [auctionId]);
        const previousUserId = previousBidders.length > 0 ? previousBidders[0].user_id : null;

        await connection.execute('INSERT INTO bids (auction_id, user_id, bid_amount) VALUES (?, ?, ?)', [auctionId, userId, amount]);
        await connection.execute('UPDATE auctions SET current_bid = ? WHERE id = ?', [amount, auctionId]);

        await connection.commit();
        return { success: true, previousUserId };
    } catch (e) {
        await connection.rollback();
        throw new Error(`Bid failed: ${e.message}`);
    } finally {
        connection.release();
    }
}

async function getAuctionById(id) {
    const query = `
        SELECT a.*, u.name as winner_name 
        FROM auctions a 
        LEFT JOIN users u ON a.winner_user_id = u.id 
        WHERE a.id = ?`;
    try {
      const [rows] = await pool.execute(query, [id]);
      return rows[0];
    } catch (err) { throw new Error("Database query failed to retrieve auction details."); }
}

async function getAuctionsByVendorId(vendorId) {
    const query = `
        SELECT a.*, u.name as winner_name 
        FROM auctions a 
        LEFT JOIN users u ON a.winner_user_id = u.id 
        WHERE a.vendor_id = ? 
        ORDER BY a.id DESC`;
    try {
      const [rows] = await pool.execute(query, [vendorId]);
      return rows;
    } catch (err) { throw new Error("Database query failed to retrieve vendor's auctions."); }
}

async function deleteAuctionById(auctionId, vendorId) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        // Check if auction can be deleted (only pending/rejected)
        const [auctions] = await connection.execute(
            'SELECT status FROM auctions WHERE id = ? AND vendor_id = ?',
            [auctionId, vendorId]
        );
        
        if (auctions.length === 0) {
            throw new Error("Auction not found or you don't have permission.");
        }
        
        const status = auctions[0].status;
        if (status !== 'pending' && status !== 'rejected') {
            throw new Error("Cannot delete an active or completed auction.");
        }
        
        // Delete bids first
        await connection.execute('DELETE FROM bids WHERE auction_id = ?', [auctionId]);
        
        // Delete auction
        const [result] = await connection.execute(
            'DELETE FROM auctions WHERE id = ? AND vendor_id = ?',
            [auctionId, vendorId]
        );
        
        await connection.commit();
        return result.affectedRows;
    } catch(err) {
        await connection.rollback();
        console.error("Error deleting auction:", err.stack);
        throw new Error(err.message || "Database query failed to delete auction.");
    } finally {
        connection.release();
    }
}

async function getBidsByAuctionId(auctionId) {
    const query = `
        SELECT b.bid_amount, b.created_at, u.name as bidder_name
        FROM bids b
        JOIN users u ON b.user_id = u.id
        WHERE b.auction_id = ?
        ORDER BY b.bid_amount DESC
    `;
    try {
        const [rows] = await pool.execute(query, [auctionId]);
        return rows;
    } catch (err) { throw new Error("Database query failed to get bid history."); }
}

async function lockAuction(auctionId, vendorId) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        // First, find the auction and the highest bidder
        const auctionQuery = `SELECT * FROM auctions WHERE id = ? AND vendor_id = ? FOR UPDATE`;
        const [auctions] = await connection.execute(auctionQuery, [auctionId, vendorId]);
        if (auctions.length === 0) throw new Error("Auction not found or you are not the owner.");

        const auction = auctions[0];
        if (auction.status === 'sold') throw new Error("This auction is already locked.");

        const highestBidQuery = `SELECT user_id, bid_amount FROM bids WHERE auction_id = ? ORDER BY bid_amount DESC LIMIT 1`;
        const [bids] = await connection.execute(highestBidQuery, [auctionId]);
        if (bids.length === 0) throw new Error("Cannot lock an auction with no bids.");
        
        const winner = bids[0];
        
        // Now, update the auction to be 'sold', set the winner, and set locked_price
        const updateQuery = `UPDATE auctions SET status = 'sold', winner_user_id = ?, locked_price = ? WHERE id = ?`;
        await connection.execute(updateQuery, [winner.user_id, winner.bid_amount, auctionId]);
        
        await connection.commit();
        return { success: true, winnerId: winner.user_id, finalPrice: winner.bid_amount };
    } catch (e) {
        await connection.rollback();
        throw new Error(`Failed to lock auction: ${e.message}`);
    } finally {
        connection.release();
    }
}

async function updateAuctionStatus(auctionId, newStatus) {
    const query = `UPDATE auctions SET status = ? WHERE id = ?`;
    try {
        const [result] = await pool.execute(query, [newStatus, auctionId]);
        return result.affectedRows;
    } catch(err) {
        console.error("Error updating auction status:", err.stack);
        throw new Error("Database query failed to update status.");
    }
}

async function expireAuctions() {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        // Find all active/approved auctions that have ended
        const expiredAuctionsQuery = `
            SELECT id FROM auctions 
            WHERE (status = 'active' OR status = 'approved') 
            AND end_time < NOW()
            FOR UPDATE
        `;
        const [expiredAuctions] = await connection.execute(expiredAuctionsQuery);
        
        for (const auction of expiredAuctions) {
            // Get highest bidder for this auction
            const highestBidQuery = `
                SELECT user_id, bid_amount 
                FROM bids 
                WHERE auction_id = ? 
                ORDER BY bid_amount DESC 
                LIMIT 1
            `;
            const [bids] = await connection.execute(highestBidQuery, [auction.id]);
            
            if (bids.length > 0) {
                // Has bids: mark as sold with winner and set locked_price
                const winner = bids[0];
                await connection.execute(
                    `UPDATE auctions SET status = 'sold', winner_user_id = ?, locked_price = ? WHERE id = ?`,
                    [winner.user_id, winner.bid_amount, auction.id]
                );
            } else {
                // No bids: mark as expired
                await connection.execute(
                    `UPDATE auctions SET status = 'expired' WHERE id = ?`,
                    [auction.id]
                );
            }
        }
        
        await connection.commit();
        return { processed: expiredAuctions.length };
    } catch (err) {
        await connection.rollback();
        console.error("Error expiring auctions:", err.stack);
        throw new Error("Failed to expire auctions.");
    } finally {
        connection.release();
    }
}

// Get all bids made by a specific customer with auction details
async function getCustomerBidHistory(customerId) {
    const query = `
        SELECT 
            b.id as bid_id,
            b.bid_amount,
            b.created_at as bid_time,
            a.id as auction_id,
            a.item_name,
            a.description,
            a.image_url,
            a.min_bid,
            a.current_bid,
            a.locked_price,
            a.status,
            a.end_time,
            a.winner_user_id,
            v.name as vendor_name,
            (SELECT MAX(b2.bid_amount) FROM bids b2 WHERE b2.auction_id = a.id) as highest_bid,
            (b.bid_amount = (SELECT MAX(b3.bid_amount) FROM bids b3 WHERE b3.auction_id = a.id)) as is_highest_bid
        FROM bids b
        INNER JOIN auctions a ON b.auction_id = a.id
        INNER JOIN users v ON a.vendor_id = v.id
        WHERE b.user_id = ?
        ORDER BY b.created_at DESC
    `;
    
    try {
        const [rows] = await pool.execute(query, [customerId]);
        return rows;
    } catch (err) {
        console.error("Error fetching customer bid history:", err.stack);
        throw new Error("Failed to fetch customer bid history.");
    }
}

// Get all auctions won by a specific customer
async function getCustomerWins(customerId) {
    const query = `
        SELECT 
            a.id as auction_id,
            a.item_name,
            a.description,
            a.image_url,
            a.locked_price,
            a.current_bid,
            a.end_time,
            a.status,
            v.name as vendor_name,
            v.email as vendor_email,
            (SELECT bid_amount FROM bids WHERE auction_id = a.id AND user_id = ? ORDER BY bid_amount DESC LIMIT 1) as my_winning_bid
        FROM auctions a
        INNER JOIN users v ON a.vendor_id = v.id
        WHERE a.winner_user_id = ? AND a.status = 'sold'
        ORDER BY a.end_time DESC
    `;
    
    try {
        const [rows] = await pool.execute(query, [customerId, customerId]);
        return rows;
    } catch (err) {
        console.error("Error fetching customer wins:", err.stack);
        throw new Error("Failed to fetch customer wins.");
    }
}

// Get customer statistics
async function getCustomerStats(customerId) {
    const query = `
        SELECT 
            COUNT(DISTINCT b.auction_id) as total_auctions_participated,
            COUNT(DISTINCT b.id) as total_bids_placed,
            (SELECT COUNT(*) FROM auctions WHERE winner_user_id = ? AND status = 'sold') as total_wins
        FROM bids b
        WHERE b.user_id = ?
    `;
    
    try {
        const [rows] = await pool.execute(query, [customerId, customerId]);
        return rows[0] || {
            total_auctions_participated: 0,
            total_bids_placed: 0,
            total_wins: 0
        };
    } catch (err) {
        console.error("Error fetching customer stats:", err.stack);
        throw new Error("Failed to fetch customer statistics.");
    }
}

// --- A SINGLE, CLEAN EXPORT BLOCK AT THE END ---
export {
    pool, createAuction, getAllAuctions, findUserByEmail, createUser, createBid,
    getAuctionById, getAuctionsByVendorId, deleteAuctionById, getBidsByAuctionId, lockAuction, updateAuctionStatus, expireAuctions,
    getCustomerBidHistory, getCustomerWins, getCustomerStats
};