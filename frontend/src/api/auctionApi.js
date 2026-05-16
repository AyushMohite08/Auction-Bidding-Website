import apiClient from "./apiClient";
import { toIsoFromDateTimeLocal } from "../utils/formatters";

function appendIfPresent(formData, key, value) {
  if (value === undefined || value === null || value === "") return;
  formData.append(key, value);
}

export function auctionFormData(values) {
  const formData = new FormData();
  appendIfPresent(formData, "itemName", values.itemName);
  appendIfPresent(formData, "description", values.description);
  appendIfPresent(formData, "minBid", values.minBid);
  appendIfPresent(formData, "startTime", toIsoFromDateTimeLocal(values.startTime));
  appendIfPresent(formData, "endTime", toIsoFromDateTimeLocal(values.endTime));
  appendIfPresent(formData, "popcornEnabled", values.popcornEnabled ? "true" : "false");
  appendIfPresent(formData, "popcornExtensionMinutes", values.popcornExtensionMinutes);
  appendIfPresent(formData, "popcornTriggerSeconds", values.popcornTriggerSeconds);
  if (values.itemImage instanceof File) {
    formData.append("itemImage", values.itemImage);
  }
  if (values.reason) {
    formData.append("reason", values.reason);
  }
  return formData;
}

export const auctionApi = {
  listAuctions: () => apiClient.get("/auctions").then((res) => res.data),
  listActiveAuctions: () => apiClient.get("/auctions/active").then((res) => res.data),
  getAuction: (id) => apiClient.get(`/auctions/${id}`).then((res) => res.data),
  getBids: (id) => apiClient.get(`/auctions/${id}/bids`).then((res) => res.data),

  placeBid: ({ auctionId, newBidAmount }) =>
    apiClient.post("/customer/bid", { auctionId: Number(auctionId), newBidAmount: Number(newBidAmount) }).then((res) => res.data),
  getCustomerBidHistory: (customerId) => apiClient.get(`/customer/${customerId}/bid-history`).then((res) => res.data),
  getCustomerWins: (customerId) => apiClient.get(`/customer/${customerId}/wins`).then((res) => res.data),
  getCustomerStats: (customerId) => apiClient.get(`/customer/${customerId}/stats`).then((res) => res.data),

  listVendorAuctions: () => apiClient.get("/vendor/auctions").then((res) => res.data),
  createVendorAuction: (values) => apiClient.post("/vendor/upload", auctionFormData(values)).then((res) => res.data),
  updateVendorAuction: (id, values) => apiClient.patch(`/vendor/auctions/${id}`, auctionFormData(values)).then((res) => res.data),
  cancelVendorAuction: (id) => apiClient.delete(`/vendor/auctions/${id}`).then((res) => res.data),
  lockVendorAuction: (id) => apiClient.post(`/vendor/auctions/${id}/lock`).then((res) => res.data),
  createChangeRequest: (id, values) =>
    apiClient.post(`/vendor/auctions/${id}/change-requests`, values).then((res) => res.data),
  listVendorChangeRequests: () => apiClient.get("/vendor/auction-change-requests").then((res) => res.data),

  updateAuctionStatus: (id, newStatus) =>
    apiClient.patch(`/admin/auctions/${id}/status`, { newStatus }).then((res) => res.data),
  updateAdminAuction: (id, values) => apiClient.patch(`/admin/auctions/${id}`, auctionFormData(values)).then((res) => res.data),
  listAdminChangeRequests: () => apiClient.get("/admin/auction-change-requests").then((res) => res.data),
  updateChangeRequestStatus: (id, values) =>
    apiClient.patch(`/admin/auction-change-requests/${id}/status`, values).then((res) => res.data),
};
