export function sendNotificationEvent(req, payload) {
  if (!req.io) {
    console.error("Socket.io server not found on request object.");
    return;
  }

  req.io.emit("new_notification", payload);
}
