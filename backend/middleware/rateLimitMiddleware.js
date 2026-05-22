import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { env } from "../config/env.js";
import * as rdsModel from "../models/rdsModel.js";

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const FIVE_MINUTES = 5 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

function rateLimitResponse(message) {
  return { success: false, message };
}

function requestIpKey(req) {
  return ipKeyGenerator(req.ip || req.socket?.remoteAddress || "unknown");
}

function userOrIpKey(req) {
  return req.user?.id || requestIpKey(req);
}

export const generalApiLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: env.rateLimits.generalMax,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: rateLimitResponse("Too many requests. Please try again shortly."),
});

export const authLoginLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: env.rateLimits.authMax,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator(req) {
    const role = String(req.params.role || "unknown").toLowerCase();
    const email = String(req.body?.email || "unknown").trim().toLowerCase();
    return `${requestIpKey(req)}:${role}:${email}`;
  },
  message: rateLimitResponse("Too many failed login attempts. Please try again later."),
});

export const registerLimiter = rateLimit({
  windowMs: ONE_HOUR,
  limit: env.rateLimits.registerMax,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: rateLimitResponse("Too many registration attempts. Please try again later."),
});

export const bidLimiter = rateLimit({
  windowMs: FIVE_MINUTES,
  limit: env.rateLimits.bidMax,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: userOrIpKey,
  message: rateLimitResponse("You are bidding too quickly. Please wait a moment and try again."),
});

export const auctionCreateLimiter = rateLimit({
  windowMs: ONE_HOUR,
  limit: env.rateLimits.auctionCreateMax,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: userOrIpKey,
  message: rateLimitResponse("Too many auction creation attempts. Please try again later."),
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
