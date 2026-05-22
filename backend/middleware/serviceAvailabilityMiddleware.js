import { env } from "../config/env.js";

export function requireApiAvailable(req, res, next) {
  if (!env.apiPaused) {
    return next();
  }

  return res.status(503).json({
    success: false,
    message: env.apiPausedMessage,
  });
}
