import express from "express";
import multer from "multer";
import { env } from "../config/env.js";
import * as auctionController from "../controllers/auctionController.js";
import { requireAuth, requireRole, requireCustomerSelfOrAdmin } from "../middleware/authMiddleware.js";
import { requireJson } from "../middleware/contentTypeMiddleware.js";
import { USER_ROLES } from "../constants/appConstants.js";

const router = express.Router();
const upload = multer({ dest: env.uploads.dir });

router.get("/auctions", auctionController.listAuctions);
router.get("/auctions/active", auctionController.listActiveAuctions);
router.get("/auctions/:id/bids", auctionController.listAuctionBids);
router.get("/auctions/:id", auctionController.getAuction);

router.post(
  "/vendor/upload",
  requireAuth,
  requireRole(USER_ROLES.VENDOR),
  upload.single("itemImage"),
  auctionController.createVendorAuction
);
router.get("/vendor/auctions", requireAuth, requireRole(USER_ROLES.VENDOR), auctionController.listVendorAuctions);
router.patch(
  "/vendor/auctions/:id",
  requireAuth,
  requireRole(USER_ROLES.VENDOR),
  upload.single("itemImage"),
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
  upload.single("itemImage"),
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
