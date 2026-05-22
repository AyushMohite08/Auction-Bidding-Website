import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { env } from "../config/env.js";
import { RATE_LIMIT_WINDOWS } from "../constants/appConstants.js";
import * as rdsModel from "../models/rdsModel.js";

function rateLimitResponse(message) {
  return { success: false, message };
}

function requestIpKey(req) {
  return ipKeyGenerator(req.ip || req.socket?.remoteAddress || "unknown");
}

function userOrIpKey(req) {
  return req.user?.id || requestIpKey(req);
}

function createLimiter({ windowMs, limit, message, keyGenerator, skipSuccessfulRequests = false }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    keyGenerator,
    skipSuccessfulRequests,
    message: rateLimitResponse(message),
  });
}

export const generalApiLimiter = createLimiter({
  windowMs: RATE_LIMIT_WINDOWS.FIFTEEN_MINUTES,
  limit: env.rateLimits.generalMax,
  message: "Too many requests. Please try again shortly.",
});

export const authLoginLimiter = createLimiter({
  windowMs: RATE_LIMIT_WINDOWS.FIFTEEN_MINUTES,
  limit: env.rateLimits.authMax,
  skipSuccessfulRequests: true,
  keyGenerator(req) {
    const role = String(req.params.role || "unknown").toLowerCase();
    const email = String(req.body?.email || "unknown").trim().toLowerCase();
    return `${requestIpKey(req)}:${role}:${email}`;
  },
  message: "Too many failed login attempts. Please try again later.",
});

export const registerLimiter = createLimiter({
  windowMs: RATE_LIMIT_WINDOWS.ONE_HOUR,
  limit: env.rateLimits.registerMax,
  message: "Too many registration attempts. Please try again later.",
});

export const bidLimiter = createLimiter({
  windowMs: RATE_LIMIT_WINDOWS.FIVE_MINUTES,
  limit: env.rateLimits.bidMax,
  keyGenerator: userOrIpKey,
  message: "You are bidding too quickly. Please wait a moment and try again.",
});

export const auctionCreateLimiter = createLimiter({
  windowMs: RATE_LIMIT_WINDOWS.ONE_HOUR,
  limit: env.rateLimits.auctionCreateMax,
  keyGenerator: userOrIpKey,
  message: "Too many auction creation attempts. Please try again later.",
});

export async function enforceVendorMonthlyAuctionLimit(req, res, next) {
  try {
    const limit = env.vendorMonthlyAuctionLimit;
    const used = await rdsModel.countVendorAuctionsCreatedThisMonth(req.user.id);

    if (used >= limit) {
      return res.status(429).json({
        success: false,
        message: `Monthly auction creation limit reached. Vendors can create up to ${limit} auctions per month.`,
      });
    }

    return next();
  } catch (error) {
    return next(error);
  }
}
