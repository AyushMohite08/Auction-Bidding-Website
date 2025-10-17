// src/api/auctionRoutes.js
import express from 'express';
import multer from 'multer';
import jwt from 'jsonwebtoken'; // <-- THIS WAS THE MISSING LINE
import { uploadMediaFile } from '../services/s3Service.js';
import { sendNotificationEvent } from '../services/notificationService.js';
import * as rdsModel from '../models/rdsModel.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// --- PUBLIC ROUTES ---
router.get("/auctions", async (req, res) => {
  try {
    const auctions = await rdsModel.getAllAuctions();
    res.status(200).json(auctions);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch auctions." });
  }
});

// GET only active/live auctions (for homepage)
router.get("/auctions/active", async (req, res) => {
  try {
    const auctions = await rdsModel.getAllAuctions();
    const now = new Date();
    const activeAuctions = auctions.filter(a => 
      (a.status === 'active' || a.status === 'approved') && 
      new Date(a.end_time) > now
    );
    res.status(200).json(activeAuctions);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch active auctions." });
  }
});

router.get("/auctions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const auction = await rdsModel.getAuctionById(id);
    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }
    res.status(200).json(auction);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch auction details." });
  }
});


// --- VENDOR ROUTES ---
router.post("/vendor/upload", upload.single("itemImage"), async (req, res) => {
  // Add startTime and endTime from the request body
  const { itemName, description, minBid, vendorId, startTime, endTime } = req.body;
  
  if (!req.file || !itemName || !minBid || !vendorId || !startTime || !endTime) {
    return res.status(400).json({ message: "Missing required auction details, file, or times." });
  }
  try {
    const imageUrl = await uploadMediaFile(req.file);
    const newAuction = await rdsModel.createAuction({
      vendor_id: vendorId, item_name: itemName, description, min_bid: minBid, image_url: imageUrl, start_time: startTime, end_time: endTime
    });
    res.status(201).json({ message: "Auction created successfully.", auction: newAuction });
  } catch (error) {
    console.error("Auction submission error:", error.message);
    res.status(500).json({ message: "Failed to create auction." });
  }
});

router.get("/vendor/auctions", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Authentication token is required." });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'vendor') {
        return res.status(403).json({ message: "Access forbidden: Not a vendor." });
    }
    const auctions = await rdsModel.getAuctionsByVendorId(decoded.id);
    res.status(200).json(auctions);
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: "Invalid token." });
    }
    res.status(500).json({ message: "Failed to fetch vendor auctions." });
  }
});


// --- CUSTOMER ROUTE ---
router.post('/customer/bid', async (req, res) => {
  const { auctionId, userId, newBidAmount } = req.body;
  try {
    const bidResult = await rdsModel.createBid(auctionId, userId, newBidAmount);
    if (bidResult.previousUserId && bidResult.previousUserId !== userId) {
      sendNotificationEvent(req, {
        auctionId,
        outbidUserId: bidResult.previousUserId,
        message: `You have been outbid on auction ${auctionId}!`
      });
    }
    res.status(200).json(bidResult);
  } catch (error) {
    console.error('Bid placement error:', error.message);
    res.status(400).json({ message: error.message });
  }
});

router.delete("/vendor/auctions/:id", async (req, res) => {
    try {
        const { id: auctionId } = req.params;
        
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ message: "No token provided" });
        
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const affectedRows = await rdsModel.deleteAuctionById(auctionId, decoded.id);

        if (affectedRows > 0) {
            res.status(200).json({ message: "Auction deleted successfully." });
        } else {
            res.status(404).json({ message: "Auction not found or you do not have permission to delete it." });
        }
    } catch (error) {
        console.error("Error in delete route:", error);
        res.status(400).json({ message: error.message || "Failed to delete auction." });
    }
});

// GET all bids for a specific auction
router.get("/auctions/:id/bids", async (req, res) => {
    try {
        const { id } = req.params;
        const bids = await rdsModel.getBidsByAuctionId(id);
        res.status(200).json(bids);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch bid history." });
    }
});

// POST to lock an auction (Vendor only)
router.post("/vendor/auctions/:id/lock", async (req, res) => {
    try {
        const { id: auctionId } = req.params;
        const authHeader = req.headers.authorization;
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const result = await rdsModel.lockAuction(auctionId, decoded.id);
        res.status(200).json({ message: "Auction locked successfully!", ...result });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Admin approves an auction
router.patch("/admin/auctions/:id/status", async (req, res) => {
    try {
        const { id: auctionId } = req.params;
        const { newStatus } = req.body; // e.g., 'approved' or 'rejected'

        // Authentication & Authorization check for admin
        const authHeader = req.headers.authorization;
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: "Forbidden: Admins only." });
        }
        
        const affectedRows = await rdsModel.updateAuctionStatus(auctionId, newStatus);
        if (affectedRows > 0) {
            res.status(200).json({ message: `Auction status updated to ${newStatus}.` });
        } else {
            res.status(404).json({ message: "Auction not found." });
        }
    } catch (error) {
        res.status(500).json({ message: "Failed to update auction status." });
    }
});

// --- CUSTOMER HISTORY & WINS ROUTES ---

// Get customer's bid history
router.get("/customer/:customerId/bid-history", async (req, res) => {
    try {
        const { customerId } = req.params;
        console.log(`📊 Bid history request for customer: ${customerId}`);
        
        // Verify token
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            console.log('❌ No authorization header');
            return res.status(401).json({ message: "Unauthorized: No token provided." });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(`🔑 Token decoded - User ID: ${decoded.id}, Role: ${decoded.role}`);
        
        // Ensure user can only access their own data (or admin can access any)
        // Compare as strings to support UUID user IDs
        if (decoded.id !== customerId && decoded.role !== 'admin') {
            console.log(`❌ Authorization failed - decoded.id: ${decoded.id}, customerId: ${customerId}`);
            return res.status(403).json({ message: "Forbidden: Access denied." });
        }
        
        console.log('✅ Authorization passed, fetching bid history...');
        const bidHistory = await rdsModel.getCustomerBidHistory(customerId);
        console.log(`✅ Found ${bidHistory.length} bids`);
        res.status(200).json(bidHistory);
    } catch (error) {
        console.error("❌ Error fetching bid history:", error);
        res.status(500).json({ message: "Failed to fetch bid history." });
    }
});

// Get customer's wins
router.get("/customer/:customerId/wins", async (req, res) => {
    try {
        const { customerId } = req.params;
        console.log(`🏆 Wins request for customer: ${customerId}`);
        
        // Verify token
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            console.log('❌ No authorization header');
            return res.status(401).json({ message: "Unauthorized: No token provided." });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(`🔑 Token decoded - User ID: ${decoded.id}, Role: ${decoded.role}`);
        
        // Ensure user can only access their own data (or admin can access any)
        // Compare as strings to support UUID user IDs
        if (decoded.id !== customerId && decoded.role !== 'admin') {
            console.log(`❌ Authorization failed - decoded.id: ${decoded.id}, customerId: ${customerId}`);
            return res.status(403).json({ message: "Forbidden: Access denied." });
        }
        
        console.log('✅ Authorization passed, fetching wins...');
        const wins = await rdsModel.getCustomerWins(customerId);
        console.log(`✅ Found ${wins.length} wins`);
        res.status(200).json(wins);
    } catch (error) {
        console.error("❌ Error fetching wins:", error);
        res.status(500).json({ message: "Failed to fetch wins." });
    }
});

// Get customer's statistics
router.get("/customer/:customerId/stats", async (req, res) => {
    try {
        const { customerId } = req.params;
        console.log(`📈 Stats request for customer: ${customerId}`);
        
        // Verify token
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            console.log('❌ No authorization header');
            return res.status(401).json({ message: "Unauthorized: No token provided." });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(`🔑 Token decoded - User ID: ${decoded.id}, Role: ${decoded.role}`);
        
        // Ensure user can only access their own data (or admin can access any)
        // Compare as strings to support UUID user IDs
        if (decoded.id !== customerId && decoded.role !== 'admin') {
            console.log(`❌ Authorization failed - decoded.id: ${decoded.id}, customerId: ${customerId}`);
            return res.status(403).json({ message: "Forbidden: Access denied." });
        }
        
        console.log('✅ Authorization passed, fetching stats...');
        const stats = await rdsModel.getCustomerStats(customerId);
        console.log(`✅ Stats calculated:`, stats);
        res.status(200).json(stats);
    } catch (error) {
        console.error("❌ Error fetching customer stats:", error);
        res.status(500).json({ message: "Failed to fetch customer statistics." });
    }
});

export default router;