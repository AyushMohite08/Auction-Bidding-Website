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
