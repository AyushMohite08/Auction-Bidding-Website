import multer from "multer";
import { env } from "../config/env.js";

const allowedAuctionImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

const auctionImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.uploads.maxAuctionImageSizeMb * 1024 * 1024,
  },
  fileFilter(req, file, callback) {
    if (!allowedAuctionImageTypes.has(file.mimetype)) {
      const error = new Error("Auction image must be JPG, PNG, WebP, or AVIF.");
      error.status = 400;
      return callback(error);
    }

    return callback(null, true);
  },
});

export function uploadAuctionImage(req, res, next) {
  auctionImageUpload.single("itemImage")(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        message: `Auction image must be ${env.uploads.maxAuctionImageSizeMb}MB or smaller.`,
      });
    }

    return res.status(error.status || 400).json({
      message: error.message || "Invalid auction image.",
    });
  });
}
