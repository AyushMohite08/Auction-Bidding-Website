import { randomUUID } from "crypto";
import ImageKit, { toFile } from "@imagekit/nodejs";
import sharp from "sharp";
import { env } from "../config/env.js";

const IMAGE_MAX_DIMENSION = 1600;
const WEBP_QUALITY = 80;

class ImageServiceError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = "ImageServiceError";
    this.status = status;
  }
}

let imagekitClient = null;

function getImageKitClient() {
  if (!env.imagekit.privateKey) {
    throw new ImageServiceError("ImageKit is not configured.");
  }

  if (!imagekitClient) {
    imagekitClient = new ImageKit({
      privateKey: env.imagekit.privateKey,
    });
  }

  return imagekitClient;
}

export function isImageServiceError(error) {
  return error instanceof ImageServiceError;
}

export async function uploadAuctionImage(file) {
  if (!file?.buffer) {
    throw new ImageServiceError("Auction image is required.", 400);
  }

  try {
    const optimizedBuffer = await sharp(file.buffer)
      .rotate()
      .resize({
        width: IMAGE_MAX_DIMENSION,
        height: IMAGE_MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    const fileName = `auction-${Date.now()}-${randomUUID().slice(0, 8)}.webp`;
    const uploadFile = await toFile(optimizedBuffer, fileName, { type: "image/webp" });
    const result = await getImageKitClient().files.upload({
      file: uploadFile,
      fileName,
      folder: env.imagekit.uploadFolder,
      useUniqueFileName: true,
      tags: ["auction-item"],
    });

    if (!result?.url) {
      throw new Error("ImageKit upload response did not include a URL.");
    }

    return {
      url: result.url,
      fileId: result.fileId,
      filePath: result.filePath,
    };
  } catch (error) {
    if (isImageServiceError(error)) throw error;
    console.error("Auction image upload error:", error);
    throw new ImageServiceError("Failed to process auction image.");
  }
}
