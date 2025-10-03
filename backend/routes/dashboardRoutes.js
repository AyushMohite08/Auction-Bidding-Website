const express = require('express');
const router = express.Router();
const rdsModel = require('../models/rdsModel');

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    // Get auction stats
    const auctions = await rdsModel.getAllAuctions();
    const activeAuctions = auctions.filter(auction => auction.status === 'active').length;
    const completedAuctions = auctions.filter(auction => auction.status === 'completed').length;

    // Get user stats
    const users = await rdsModel.getAllUsers();
    const vendors = users.filter(user => user.role === 'vendor').length;
    const customers = users.filter(user => user.role === 'customer').length;

    // Get total bids count
    const totalBids = await rdsModel.getTotalBidsCount();

    res.status(200).json({
      activeAuctions,
      completedAuctions,
      totalAuctions: auctions.length,
      totalVendors: vendors,
      totalCustomers: customers,
      totalBids,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
});

module.exports = router;