import express from "express";
import * as auctionController from "../controllers/auctionController.js";
import { requireAuth, requireRole, requireCustomerSelfOrAdmin } from "../middleware/authMiddleware.js";
import { requireJson } from "../middleware/contentTypeMiddleware.js";
import { auctionCreateLimiter, bidLimiter, enforceVendorMonthlyAuctionLimit } from "../middleware/rateLimitMiddleware.js";
import { uploadAuctionImage } from "../middleware/uploadMiddleware.js";
import { USER_ROLES } from "../constants/appConstants.js";

const router = express.Router();

router.get("/auctions", auctionController.listAuctions);
router.get("/auctions/active", auctionController.listActiveAuctions);
router.get("/auctions/:id/bids", auctionController.listAuctionBids);
router.get("/auctions/:id", auctionController.getAuction);

router.post(
  "/vendor/upload",
  requireAuth,
  requireRole(USER_ROLES.VENDOR),
  auctionCreateLimiter,
  enforceVendorMonthlyAuctionLimit,
  uploadAuctionImage,
  auctionController.createVendorAuction
);
router.get("/vendor/auctions", requireAuth, requireRole(USER_ROLES.VENDOR), auctionController.listVendorAuctions);
router.patch(
  "/vendor/auctions/:id",
  requireAuth,
  requireRole(USER_ROLES.VENDOR),
  uploadAuctionImage,
  auctionController.updateVendorAuction
);
router.delete(
  "/vendor/auctions/:id",
  requireAuth,
  requireRole(USER_ROLES.VENDOR),
  auctionController.deleteVendorAuction
);
router.post(
  "/vendor/auctions/:id/lock",
  requireAuth,
  requireRole(USER_ROLES.VENDOR),
  auctionController.lockVendorAuction
);
router.post(
  "/vendor/auctions/:id/change-requests",
  requireAuth,
  requireRole(USER_ROLES.VENDOR),
  requireJson,
  auctionController.createAuctionChangeRequest
);
router.get(
  "/vendor/auction-change-requests",
  requireAuth,
  requireRole(USER_ROLES.VENDOR),
  auctionController.listVendorChangeRequests
);

router.post(
  "/customer/bid",
  requireAuth,
  requireRole(USER_ROLES.CUSTOMER),
  bidLimiter,
  requireJson,
  auctionController.placeBid
);
router.get(
  "/customer/:customerId/bid-history",
  requireAuth,
  requireCustomerSelfOrAdmin("customerId"),
  auctionController.getCustomerBidHistory
);
router.get(
  "/customer/:customerId/wins",
  requireAuth,
  requireCustomerSelfOrAdmin("customerId"),
  auctionController.getCustomerWins
);
router.get(
  "/customer/:customerId/stats",
  requireAuth,
  requireCustomerSelfOrAdmin("customerId"),
  auctionController.getCustomerStats
);

router.patch(
  "/admin/auctions/:id/status",
  requireAuth,
  requireRole(USER_ROLES.ADMIN),
  requireJson,
  auctionController.updateAuctionStatus
);
router.patch(
  "/admin/auctions/:id",
  requireAuth,
  requireRole(USER_ROLES.ADMIN),
  uploadAuctionImage,
  auctionController.updateAdminAuction
);
router.get(
  "/admin/auction-change-requests",
  requireAuth,
  requireRole(USER_ROLES.ADMIN),
  auctionController.listAdminChangeRequests
);
router.patch(
  "/admin/auction-change-requests/:id/status",
  requireAuth,
  requireRole(USER_ROLES.ADMIN),
  requireJson,
  auctionController.updateChangeRequestStatus
);

export default router;
