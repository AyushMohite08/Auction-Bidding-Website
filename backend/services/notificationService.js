export function sendNotificationEvent(req, payload) {
  emitNotificationEvent(req.io, payload);
}

export function emitNotificationEvent(io, payload) {
  if (!io) {
    console.error("Socket.io server not found for notification event.");
    return;
  }

  io.emit("new_notification", normalizePayload(payload));
}

function normalizePayload(payload = {}) {
  return {
    type: payload.type || "auction_updated",
    auctionId: payload.auctionId,
    requestId: payload.requestId,
    message: payload.message || "Auction activity updated.",
    createdAt: payload.createdAt || new Date().toISOString(),
  };
}
