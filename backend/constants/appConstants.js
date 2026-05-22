export const USER_ROLES = Object.freeze({
  CUSTOMER: "customer",
  VENDOR: "vendor",
  ADMIN: "admin",
});

export const PUBLIC_REGISTRATION_ROLES = Object.freeze([
  USER_ROLES.CUSTOMER,
  USER_ROLES.VENDOR,
]);

export const AUCTION_STATUSES = Object.freeze({
  PENDING: "pending",
  APPROVED: "approved",
  ACTIVE: "active",
  SOLD: "sold",
  EXPIRED: "expired",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
});

export const ACTIVE_AUCTION_STATUSES = Object.freeze([
  AUCTION_STATUSES.ACTIVE,
  AUCTION_STATUSES.APPROVED,
]);

export const ADMIN_AUCTION_STATUSES = Object.freeze([
  AUCTION_STATUSES.APPROVED,
  AUCTION_STATUSES.REJECTED,
]);

export const DEFAULT_SERVICE_UNAVAILABLE_MESSAGE =
  "Service temporarily unavailable. Please try again later.";

export const RATE_LIMIT_WINDOWS = Object.freeze({
  FIVE_MINUTES: 5 * 60 * 1000,
  FIFTEEN_MINUTES: 15 * 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
});
