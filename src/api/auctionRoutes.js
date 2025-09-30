// src/api/auctionRoutes.js (FINAL CJS VERSION)

// 1. Convert ESM 'import' to CJS 'require' syntax
const express = require('express');
const multer = require('multer');
const { uploadMediaFile } = require('../utils/s3Service');
const { sendNotificationEvent } = require('../utils/notificationService');
const rdsModel = require('../models/rdsModel'); // Use require for CJS import

// 2. Initialize the Express application and router
const app = express();
const router = express.Router();

// Middleware Setup
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
const upload = multer({ dest: 'uploads/' }); 

// --- 1. API Route for Media File Upload (Vendor Submission) ---
router.post('/vendor/upload', upload.single('itemImage'), async (req, res) => {
    // Check for necessary fields
    const { itemName, description, minBid, vendorId } = req.body; 
    
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }
    
    if (!itemName || !minBid || !vendorId) {
         return res.status(400).json({ message: 'Missing required item details for submission.' });
    }

    try {
        const imageUrl = await uploadMediaFile(req.file);
        
        // Save auction details (including the S3 URL) to RDS (auctiondb)
        const newAuctionData = {
            itemName, description, minBid, 
            vendorId, 
            imageUrl,
            endTime: new Date(Date.now() + 72 * 3600 * 1000) 
        };

        // Call the CJS-compatible rdsModel function
        // const auctionId = await rdsModel.createNewAuction(newAuctionData); 
        
        res.status(200).json({ 
            message: 'Item uploaded and submitted for admin review.',
            url: imageUrl,
        });

    } catch (error) {
        console.error('Auction submission error:', error.message);
        res.status(500).json({ message: error.message });
    }
});


// --- 2. API Route for Placing a Bid (Triggers Lambda) ---
router.post('/customer/bid', async (req, res) => {
    const { auctionId, userId, newBidAmount } = req.body; 
    
    try {
        // Call the CJS-compatible rdsModel function
        const bidResult = await rdsModel.createBid(auctionId, userId, newBidAmount); 

        // Trigger Lambda Notification
        if (bidResult.previousUserId && bidResult.previousUserId !== userId) {
            const outbidUserEmail = 'outbid_user_lookup@example.com'; 

            await sendNotificationEvent({
                auctionId: auctionId,
                outbidEmail: outbidUserEmail,
                currentWinningBid: newBidAmount
            });
        }

        res.status(200).json({ 
            message: 'Bid placed successfully and notification triggered if needed.',
            currentBid: newBidAmount
        });

    } catch (error) {
        console.error('Bid placement error:', error.message);
        res.status(400).json({ message: error.message });
    }
});

// 3. Attach the router paths to the main application paths
app.use('/api', router); 
app.use('/api/auth', router); 

// --- SERVER STARTUP ---
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`AuctionHub API running on port ${PORT}`);
    console.log(`RDS Host: ${process.env.RDS_HOST}`);
    console.log(`Lambda: ${process.env.LAMBDA_FUNCTION_NAME}`);
});

// No need for module.exports as app.listen() starts the server directly