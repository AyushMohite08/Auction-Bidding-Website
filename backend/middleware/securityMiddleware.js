import { env } from "../config/env.js";

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function requireAllowedOrigin(req, res, next) {
  if (!unsafeMethods.has(req.method)) {
    return next();
  }

  const origin = req.get("origin");
  if (!origin || env.frontendOrigins.includes(origin)) {
    return next();
  }

  return res.status(403).json({ success: false, message: "Request origin is not allowed." });
}
