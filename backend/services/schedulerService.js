import * as rdsModel from "../models/rdsModel.js";
import { emitNotificationEvent } from "./notificationService.js";

let schedulerInterval = null;
const CHECK_INTERVAL = 60 * 1000;

export function startScheduler(io) {
  if (schedulerInterval) {
    console.log("Auction expiry scheduler already running.");
    return;
  }

  console.log("Starting auction expiry scheduler.");
  checkExpiredAuctions(io);
  schedulerInterval = setInterval(() => checkExpiredAuctions(io), CHECK_INTERVAL);
}

export function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("Auction expiry scheduler stopped.");
  }
}

async function checkExpiredAuctions(io) {
  try {
    const result = await rdsModel.expireAuctions();
    if (result.processed > 0) {
      console.log(`Processed ${result.processed} expired auction(s).`);
      result.changes.forEach((change) => {
        emitNotificationEvent(io, {
          type: change.status === "sold" ? "auction_sold" : "auction_expired",
          auctionId: change.auctionId,
          message: change.status === "sold" ? "An auction closed with a winner." : "An auction expired without bids.",
        });
      });
    }
  } catch (err) {
    console.error("Scheduler error:", err.message);
  }
}
