import { API_SERVER_URL } from "../api/apiClient";

export const ACTIVE_STATUSES = ["approved", "active"];
export const CLOSED_STATUSES = ["sold", "expired", "rejected", "cancelled"];

export function isActiveAuction(auction) {
  if (!auction) return false;
  return ACTIVE_STATUSES.includes(auction.status) && !auction.locked_price && new Date(auction.end_time) > new Date();
}

export function hasAuctionStarted(auction) {
  if (!auction?.start_time) return false;
  return new Date(auction.start_time) <= new Date();
}

export function hasAuctionEnded(auction) {
  if (!auction?.end_time) return false;
  return new Date(auction.end_time) <= new Date();
}

export function formatCurrency(value) {
  const number = Number(value || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(number) ? number : 0);
}

export function formatDate(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function imageUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_SERVER_URL}${path}`;
}

export function priceForAuction(auction) {
  return auction?.locked_price || auction?.current_bid || auction?.min_bid || 0;
}

export function toInputDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export function toIsoFromDateTimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

export function parseRequestedChanges(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

export function compactError(error, fallback = "Something went wrong.") {
  return error?.response?.data?.message || error?.message || fallback;
}
