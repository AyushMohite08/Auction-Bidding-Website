// backend/services/schedulerService.js
import * as rdsModel from '../models/rdsModel.js';

let schedulerInterval = null;

// Check for expired auctions every minute
const CHECK_INTERVAL = 60 * 1000; // 60 seconds

export function startScheduler() {
    if (schedulerInterval) {
        console.log('⏰ Scheduler already running');
        return;
    }
    
    console.log('⏰ Starting auction expiry scheduler...');
    
    // Run immediately on startup
    checkExpiredAuctions();
    
    // Then run every minute
    schedulerInterval = setInterval(() => {
        checkExpiredAuctions();
    }, CHECK_INTERVAL);
}

export function stopScheduler() {
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
        console.log('⏰ Scheduler stopped');
    }
}

async function checkExpiredAuctions() {
    try {
        const result = await rdsModel.expireAuctions();
        if (result.processed > 0) {
            console.log(`⏰ Processed ${result.processed} expired auction(s)`);
        }
    } catch (err) {
        console.error('⏰ Scheduler error:', err.message);
    }
}
