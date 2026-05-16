import * as rdsModel from "../models/rdsModel.js";

let schedulerInterval = null;
const CHECK_INTERVAL = 60 * 1000;

export function startScheduler() {
  if (schedulerInterval) {
    console.log("Auction expiry scheduler already running.");
    return;
  }

  console.log("Starting auction expiry scheduler.");
  checkExpiredAuctions();
  schedulerInterval = setInterval(checkExpiredAuctions, CHECK_INTERVAL);
}

export function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("Auction expiry scheduler stopped.");
  }
}

async function checkExpiredAuctions() {
  try {
    const result = await rdsModel.expireAuctions();
    if (result.processed > 0) {
      console.log(`Processed ${result.processed} expired auction(s).`);
    }
  } catch (err) {
    console.error("Scheduler error:", err.message);
  }
}
