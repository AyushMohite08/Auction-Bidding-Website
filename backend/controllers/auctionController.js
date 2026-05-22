import { ACTIVE_AUCTION_STATUSES, ADMIN_AUCTION_STATUSES, AUCTION_STATUSES } from "../constants/appConstants.js";
import * as rdsModel from "../models/rdsModel.js";
import * as auctionService from "../services/auctionService.js";
import * as imageService from "../services/imageService.js";
import { sendNotificationEvent } from "../services/notificationService.js";
import { sendControllerError } from "../utils/http.js";

export async function listAuctions(req, res) {
  try {
    const auctions = await rdsModel.getAllAuctions();
    return res.status(200).json(auctions);
  } catch (error) {
    console.error("Fetch auctions error:", error);
    return sendControllerError(res, error, "Failed to fetch auctions.");
  }
}

export async function listActiveAuctions(req, res) {
  try {
    const auctions = await rdsModel.getActiveAuctions();
    return res.status(200).json(auctions);
  } catch (error) {
    console.error("Fetch active auctions error:", error);
    return sendControllerError(res, error, "Failed to fetch active auctions.");
  }
}

export async function getAuction(req, res) {
  const auctionId = auctionService.parsePositiveInteger(req.params.id);
  if (!auctionId) {
    return res.status(400).json({ message: "Invalid auction id." });
  }

  try {
    const auction = await rdsModel.getAuctionById(auctionId);
    if (!auction) {
      return res.status(404).json({ message: "Auction not found." });
    }

    return res.status(200).json(auction);
  } catch (error) {
    console.error("Fetch auction error:", error);
    return sendControllerError(res, error, "Failed to fetch auction details.");
  }
}

export async function createVendorAuction(req, res) {
  const { itemName, description, minBid, startTime, endTime } = req.body;

  if (!req.file || !itemName || !description || !minBid || !startTime || !endTime) {
    return res.status(400).json({ message: "Missing required auction details, file, or times." });
  }

  const parsedMinBid = auctionService.parsePositiveNumber(minBid);
  if (!parsedMinBid) {
    return res.status(400).json({ message: "Minimum bid must be a positive number." });
  }

  const dateError = auctionService.validateAuctionDates(startTime, endTime);
  if (dateError) {
    return res.status(400).json({ message: dateError });
  }

  const popcornSettings = auctionService.getPopcornSettings(req.body);
  if (popcornSettings.error) {
    return res.status(400).json({ message: popcornSettings.error });
  }

  try {
    const uploadedImage = await imageService.uploadAuctionImage(req.file);
    const auction = await rdsModel.createAuction({
      vendor_id: req.user.id,
      item_name: String(itemName).trim(),
      description: String(description).trim(),
      min_bid: parsedMinBid,
      image_url: uploadedImage.url,
      start_time: auctionService.formatDateForDb(startTime),
      end_time: auctionService.formatDateForDb(endTime),
      ...popcornSettings,
    });
    sendNotificationEvent(req, {
      type: "auction_created",
      auctionId: auction.id,
      message: "A vendor submitted a new auction for review.",
    });

    return res.status(201).json({ message: "Auction created successfully.", auction });
  } catch (error) {
    if (imageService.isImageServiceError(error)) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error("Auction submission error:", error);
    return sendControllerError(res, error, "Failed to create auction.");
  }
}

export async function listVendorAuctions(req, res) {
  try {
    const auctions = await rdsModel.getAuctionsByVendorId(req.user.id);
    return res.status(200).json(auctions);
  } catch (error) {
    console.error("Fetch vendor auctions error:", error);
    return sendControllerError(res, error, "Failed to fetch vendor auctions.");
  }
}

export async function placeBid(req, res) {
  const auctionId = auctionService.parsePositiveInteger(req.body.auctionId);
  const bidAmount = auctionService.parsePositiveNumber(req.body.newBidAmount);

  if (!auctionId || !bidAmount) {
    return res.status(400).json({ message: "Auction id and bid amount are required." });
  }

  try {
    const bidResult = await rdsModel.createBid(auctionId, req.user.id, bidAmount);
    sendNotificationEvent(req, {
      type: "bid_placed",
      auctionId,
      message: "A new bid was placed.",
    });
    if (bidResult.popcornExtended) {
      sendNotificationEvent(req, {
        auctionId,
        type: "auction_time_extended",
        message: bidResult.popcornNotice,
        newEndTime: bidResult.newEndTime,
      });
    }

    return res.status(200).json(bidResult);
  } catch (error) {
    console.error("Bid placement error:", error.message);
    return sendControllerError(res, error, error.message, 400);
  }
}

export async function deleteVendorAuction(req, res) {
  const auctionId = auctionService.parsePositiveInteger(req.params.id);
  if (!auctionId) {
    return res.status(400).json({ message: "Invalid auction id." });
  }

  try {
    const affectedRows = await rdsModel.deleteAuctionById(auctionId, req.user.id);
    if (affectedRows === 0) {
      return res.status(404).json({ message: "Auction not found or you do not have permission to delete it." });
    }

    await rdsModel.addAuctionAuditLog({
      auctionId,
      actorId: req.user.id,
      action: "vendor_cancelled",
    });
    sendNotificationEvent(req, {
      type: "auction_cancelled",
      auctionId,
      message: "A vendor cancelled an auction.",
    });

    return res.status(200).json({ message: "Auction cancelled successfully." });
  } catch (error) {
    console.error("Delete auction error:", error.message);
    return sendControllerError(res, error, error.message || "Failed to delete auction.", 400);
  }
}

export async function updateVendorAuction(req, res) {
  const auctionId = auctionService.parsePositiveInteger(req.params.id);
  if (!auctionId) {
    return res.status(400).json({ message: "Invalid auction id." });
  }

  try {
    const auction = await rdsModel.getAuctionById(auctionId);
    if (!auction || auction.vendor_id !== req.user.id) {
      return res.status(404).json({ message: "Auction not found or you do not have permission to edit it." });
    }
    if (
      [AUCTION_STATUSES.SOLD, AUCTION_STATUSES.EXPIRED, AUCTION_STATUSES.CANCELLED].includes(auction.status) ||
      auction.locked_price !== null
    ) {
      return res.status(400).json({ message: "This auction can no longer be edited." });
    }

    const allowedFields = auctionService.getVendorEditableFields(
      auction,
      await rdsModel.countBidsByAuctionId(auctionId)
    );
    if (!allowedFields) {
      return res.status(400).json({
        message: "Auction cannot be edited directly now. Please submit a change request.",
      });
    }

    const hasImageUpdate = Boolean(req.file && allowedFields.includes("image_url"));
    const updates = auctionService.normalizeAuctionChanges(req.body, allowedFields);
    const updateError = auctionService.validateAuctionUpdates(updates, { hasImageUpdate });
    if (updateError) {
      return res.status(400).json({ message: updateError });
    }

    const dateError = auctionService.validateAuctionUpdateDates(auction, updates);
    if (dateError) {
      return res.status(400).json({ message: dateError });
    }
    if (hasImageUpdate) {
      const uploadedImage = await imageService.uploadAuctionImage(req.file);
      updates.image_url = uploadedImage.url;
    }

    const updatedAuction = await rdsModel.updateAuctionFields(auctionId, updates);
    await rdsModel.addAuctionAuditLog({
      auctionId,
      actorId: req.user.id,
      action: "vendor_update",
      details: updates,
    });
    sendNotificationEvent(req, {
      type: "auction_updated",
      auctionId,
      message: "A vendor updated an auction.",
    });

    return res.status(200).json({ message: "Auction updated successfully.", auction: updatedAuction });
  } catch (error) {
    if (imageService.isImageServiceError(error)) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error("Vendor auction update error:", error);
    return sendControllerError(res, error, "Failed to update auction.");
  }
}

export async function listAuctionBids(req, res) {
  const auctionId = auctionService.parsePositiveInteger(req.params.id);
  if (!auctionId) {
    return res.status(400).json({ message: "Invalid auction id." });
  }

  try {
    const bids = await rdsModel.getBidsByAuctionId(auctionId);
    return res.status(200).json(bids);
  } catch (error) {
    console.error("Fetch bids error:", error);
    return sendControllerError(res, error, "Failed to fetch bid history.");
  }
}

export async function lockVendorAuction(req, res) {
  const auctionId = auctionService.parsePositiveInteger(req.params.id);
  if (!auctionId) {
    return res.status(400).json({ message: "Invalid auction id." });
  }

  try {
    const result = await rdsModel.lockAuction(auctionId, req.user.id);
    sendNotificationEvent(req, {
      type: "auction_locked",
      auctionId,
      message: "An auction was locked by the vendor.",
    });
    return res.status(200).json({ message: "Auction locked successfully!", ...result });
  } catch (error) {
    return sendControllerError(res, error, error.message, 400);
  }
}

export async function updateAuctionStatus(req, res) {
  const auctionId = auctionService.parsePositiveInteger(req.params.id);
  const { newStatus } = req.body;

  if (!auctionId) {
    return res.status(400).json({ message: "Invalid auction id." });
  }
  if (!ADMIN_AUCTION_STATUSES.includes(newStatus)) {
    return res.status(400).json({ message: "Auction status must be approved or rejected." });
  }

  try {
    const auction = await rdsModel.getAuctionById(auctionId);
    if (!auction) {
      return res.status(404).json({ message: "Auction not found." });
    }
    if (auction.status !== AUCTION_STATUSES.PENDING) {
      return res.status(400).json({ message: "Only pending auctions can be approved or rejected." });
    }

    await rdsModel.updateAuctionStatus(auctionId, newStatus);
    await rdsModel.addAuctionAuditLog({
      auctionId,
      actorId: req.user.id,
      action: "admin_status_update",
      details: { status: newStatus },
    });
    sendNotificationEvent(req, {
      type: newStatus === AUCTION_STATUSES.APPROVED ? "auction_approved" : "auction_rejected",
      auctionId,
      message: `An auction was ${newStatus}.`,
    });
    return res.status(200).json({ message: `Auction status updated to ${newStatus}.` });
  } catch (error) {
    console.error("Update auction status error:", error);
    return sendControllerError(res, error, "Failed to update auction status.");
  }
}

export async function updateAdminAuction(req, res) {
  const auctionId = auctionService.parsePositiveInteger(req.params.id);
  const { reason } = req.body;

  if (!auctionId) {
    return res.status(400).json({ message: "Invalid auction id." });
  }
  if (req.body.vendorId || req.body.vendor_id) {
    return res.status(400).json({ message: "Vendor cannot be changed." });
  }

  try {
    const auction = await rdsModel.getAuctionById(auctionId);
    if (!auction) {
      return res.status(404).json({ message: "Auction not found." });
    }
    if ([AUCTION_STATUSES.SOLD, AUCTION_STATUSES.EXPIRED, AUCTION_STATUSES.CANCELLED].includes(auction.status)) {
      return res.status(400).json({ message: "Sold, expired, or cancelled auctions cannot be edited." });
    }

    const bidCount = await rdsModel.countBidsByAuctionId(auctionId);
    const hasBids = bidCount > 0;
    const allowedFields = auctionService.getAdminEditableFields(hasBids);

    if (hasBids && !reason) {
      return res.status(400).json({ message: "Reason is required for admin edits after bids exist." });
    }

    const hasImageUpdate = Boolean(req.file && allowedFields.includes("image_url"));
    const updates = auctionService.normalizeAuctionChanges(req.body, allowedFields);
    const updateError = auctionService.validateAuctionUpdates(updates, { hasImageUpdate });
    if (updateError) {
      return res.status(400).json({ message: updateError });
    }

    const dateError = auctionService.validateAuctionUpdateDates(auction, updates);
    if (dateError) {
      return res.status(400).json({ message: dateError });
    }
    if (hasImageUpdate) {
      const uploadedImage = await imageService.uploadAuctionImage(req.file);
      updates.image_url = uploadedImage.url;
    }

    const updatedAuction = await rdsModel.updateAuctionFields(auctionId, updates);
    await rdsModel.addAuctionAuditLog({
      auctionId,
      actorId: req.user.id,
      action: hasBids ? "admin_emergency_update" : "admin_update",
      details: updates,
      reason: reason || null,
    });
    sendNotificationEvent(req, {
      type: "auction_updated",
      auctionId,
      message: "An admin updated an auction.",
    });

    return res.status(200).json({ message: "Auction updated successfully.", auction: updatedAuction });
  } catch (error) {
    if (imageService.isImageServiceError(error)) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error("Admin auction update error:", error);
    return sendControllerError(res, error, "Failed to update auction.");
  }
}

export async function createAuctionChangeRequest(req, res) {
  const auctionId = auctionService.parsePositiveInteger(req.params.id);
  if (!auctionId) {
    return res.status(400).json({ message: "Invalid auction id." });
  }

  const requestedChanges = auctionService.parseJsonMaybe(req.body.requestedChanges);
  if (req.body.description !== undefined) requestedChanges.description = req.body.description;
  if (req.body.endTime !== undefined) requestedChanges.endTime = req.body.endTime;

  const allowedKeys = ["description", "endTime"];
  const invalidKeys = Object.keys(requestedChanges).filter((key) => !allowedKeys.includes(key));
  if (invalidKeys.length > 0 || Object.keys(requestedChanges).length === 0) {
    return res.status(400).json({ message: "Requests may include only description and endTime." });
  }

  try {
    const auction = await rdsModel.getAuctionById(auctionId);
    if (!auction || auction.vendor_id !== req.user.id) {
      return res.status(404).json({ message: "Auction not found or you do not have permission." });
    }
    if (!ACTIVE_AUCTION_STATUSES.includes(auction.status) || auction.locked_price !== null) {
      return res.status(400).json({ message: "Change requests are allowed only for active approved auctions." });
    }
    if (requestedChanges.endTime !== undefined) {
      const endTime = new Date(requestedChanges.endTime);
      if (Number.isNaN(endTime.getTime()) || endTime <= new Date(auction.start_time) || endTime <= new Date()) {
        return res.status(400).json({ message: "Requested end time must be valid and in the future." });
      }
    }

    const request = await rdsModel.createAuctionChangeRequest({
      auctionId,
      vendorId: req.user.id,
      requestedChanges,
      reason: req.body.reason,
    });

    await rdsModel.addAuctionAuditLog({
      auctionId,
      actorId: req.user.id,
      action: "vendor_change_request_created",
      details: requestedChanges,
      reason: req.body.reason || null,
    });
    sendNotificationEvent(req, {
      type: "change_request_created",
      auctionId,
      requestId: request.id,
      message: "A vendor submitted an auction change request.",
    });

    return res.status(201).json({ message: "Change request submitted successfully.", request });
  } catch (error) {
    console.error("Create change request error:", error);
    return sendControllerError(res, error, "Failed to create change request.");
  }
}

export async function listVendorChangeRequests(req, res) {
  try {
    const requests = await rdsModel.getVendorAuctionChangeRequests(req.user.id);
    return res.status(200).json(requests);
  } catch (error) {
    console.error("Fetch vendor change requests error:", error);
    return sendControllerError(res, error, "Failed to fetch change requests.");
  }
}

export async function listAdminChangeRequests(req, res) {
  try {
    const requests = await rdsModel.getAllAuctionChangeRequests();
    return res.status(200).json(requests);
  } catch (error) {
    console.error("Fetch admin change requests error:", error);
    return sendControllerError(res, error, "Failed to fetch change requests.");
  }
}

export async function updateChangeRequestStatus(req, res) {
  const requestId = auctionService.parsePositiveInteger(req.params.id);
  const { status, adminNote } = req.body;

  if (!requestId) {
    return res.status(400).json({ message: "Invalid request id." });
  }
  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Status must be approved or rejected." });
  }

  try {
    const request = await rdsModel.getAuctionChangeRequestById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Change request not found." });
    }
    if (request.status !== "pending") {
      return res.status(400).json({ message: "Only pending requests can be updated." });
    }

    const requestedChanges = auctionService.parseJsonMaybe(request.requested_changes);
    if (status === "approved") {
      const auction = await rdsModel.getAuctionById(request.auction_id);
      if (!auction || !ACTIVE_AUCTION_STATUSES.includes(auction.status) || auction.locked_price !== null) {
        return res.status(400).json({ message: "Auction can no longer accept this change." });
      }

      const updates = {};
      if (requestedChanges.description !== undefined) updates.description = String(requestedChanges.description).trim();
      if (requestedChanges.endTime !== undefined) updates.end_time = auctionService.formatDateForDb(requestedChanges.endTime);

      const dateError = auctionService.validateAuctionUpdateDates(auction, updates);
      if (dateError) {
        return res.status(400).json({ message: dateError });
      }

      await rdsModel.updateAuctionFields(request.auction_id, updates);
      await rdsModel.addAuctionAuditLog({
        auctionId: request.auction_id,
        actorId: req.user.id,
        action: "change_request_approved",
        details: updates,
        reason: adminNote || request.reason || null,
      });
    } else {
      await rdsModel.addAuctionAuditLog({
        auctionId: request.auction_id,
        actorId: req.user.id,
        action: "change_request_rejected",
        details: requestedChanges,
        reason: adminNote || null,
      });
    }

    const updatedRequest = await rdsModel.updateAuctionChangeRequestStatus({
      requestId,
      status,
      adminId: req.user.id,
      adminNote,
    });
    sendNotificationEvent(req, {
      type: status === "approved" ? "change_request_approved" : "change_request_rejected",
      auctionId: request.auction_id,
      requestId,
      message: `A change request was ${status}.`,
    });

    return res.status(200).json({ message: `Change request ${status}.`, request: updatedRequest });
  } catch (error) {
    console.error("Update change request error:", error);
    return sendControllerError(res, error, "Failed to update change request.");
  }
}

export async function getCustomerBidHistory(req, res) {
  try {
    const bidHistory = await rdsModel.getCustomerBidHistory(req.params.customerId);
    return res.status(200).json(bidHistory);
  } catch (error) {
    console.error("Fetch bid history error:", error);
    return sendControllerError(res, error, "Failed to fetch bid history.");
  }
}

export async function getCustomerWins(req, res) {
  try {
    const wins = await rdsModel.getCustomerWins(req.params.customerId);
    return res.status(200).json(wins);
  } catch (error) {
    console.error("Fetch wins error:", error);
    return sendControllerError(res, error, "Failed to fetch wins.");
  }
}

export async function getCustomerStats(req, res) {
  try {
    const stats = await rdsModel.getCustomerStats(req.params.customerId);
    return res.status(200).json(stats);
  } catch (error) {
    console.error("Fetch customer stats error:", error);
    return sendControllerError(res, error, "Failed to fetch customer statistics.");
  }
}
