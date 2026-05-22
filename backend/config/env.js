import dotenv from "dotenv";
import { DEFAULT_SERVICE_UNAVAILABLE_MESSAGE } from "../constants/appConstants.js";

dotenv.config();

function parseCsv(value, fallback = []) {
  if (!value) return fallback;
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseBoolean(value, fallback) {
  if (value === undefined) return fallback;
  return ["1", "true", "yes"].includes(String(value).toLowerCase());
}

function parseDurationMs(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function parsePositiveNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function parsePositiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function parseSameSite(value) {
  const sameSite = String(value || "lax").toLowerCase();
  return ["lax", "strict", "none"].includes(sameSite) ? sameSite : "lax";
}

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";
const defaultOrigins = ["http://localhost:3000", "http://localhost:5173"];
const frontendOrigins = parseCsv(
  process.env.FRONTEND_ORIGINS || process.env.FRONTEND_URL,
  defaultOrigins
);

const jwtSecret = process.env.JWT_SECRET || (isProduction ? undefined : "development-only-jwt-secret");
const accessSecret = process.env.JWT_ACCESS_SECRET || jwtSecret;
const refreshSecret = process.env.JWT_REFRESH_SECRET || jwtSecret;
const cookieSameSite = parseSameSite(process.env.AUTH_COOKIE_SAME_SITE);

if (!accessSecret || !refreshSecret) {
  throw new Error("JWT_ACCESS_SECRET/JWT_REFRESH_SECRET or JWT_SECRET must be configured.");
}

export const env = {
  nodeEnv,
  isProduction,
  port: process.env.PORT || 3000,
  frontendOrigins,
  db: {
    host: process.env.RDS_HOST,
    user: process.env.RDS_USER,
    password: process.env.RDS_PASS,
    database: process.env.RDS_DB,
    port: Number(process.env.RDS_PORT || 3306),
  },
  auth: {
    accessSecret,
    refreshSecret,
    accessCookieName: process.env.AUTH_ACCESS_COOKIE_NAME || process.env.AUTH_COOKIE_NAME || "auction_access",
    refreshCookieName: process.env.AUTH_REFRESH_COOKIE_NAME || "auction_refresh",
    accessTokenTtl: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshTokenTtl: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    accessCookieMaxAgeMs: parseDurationMs(process.env.AUTH_ACCESS_COOKIE_MAX_AGE_MS, 15 * 60 * 1000),
    refreshCookieMaxAgeMs: parseDurationMs(process.env.AUTH_REFRESH_COOKIE_MAX_AGE_MS, 7 * 24 * 60 * 60 * 1000),
    cookieDomain: process.env.AUTH_COOKIE_DOMAIN || undefined,
    cookieSameSite,
    cookieSecure: parseBoolean(process.env.AUTH_COOKIE_SECURE, cookieSameSite === "none"),
  },
  images: {
    maxAuctionImageSizeMb: parsePositiveNumber(process.env.MAX_AUCTION_IMAGE_SIZE_MB, 5),
  },
  imagekit: {
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "",
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || "",
    uploadFolder: process.env.IMAGEKIT_UPLOAD_FOLDER || "/auction-items",
  },
  rateLimits: {
    generalMax: parsePositiveInteger(process.env.RATE_LIMIT_GENERAL_MAX, 600),
    authMax: parsePositiveInteger(process.env.RATE_LIMIT_AUTH_MAX, 5),
    registerMax: parsePositiveInteger(process.env.RATE_LIMIT_REGISTER_MAX, 5),
    bidMax: parsePositiveInteger(process.env.RATE_LIMIT_BID_MAX, 30),
    auctionCreateMax: parsePositiveInteger(process.env.RATE_LIMIT_AUCTION_CREATE_MAX, 10),
  },
  vendorMonthlyAuctionLimit: parsePositiveInteger(process.env.VENDOR_MONTHLY_AUCTION_LIMIT, 20),
  apiPaused: parseBoolean(process.env.API_PAUSED, false),
  apiPausedMessage: process.env.API_PAUSED_MESSAGE || DEFAULT_SERVICE_UNAVAILABLE_MESSAGE,
  socketDebug: parseBoolean(process.env.SOCKET_DEBUG, false),
};
