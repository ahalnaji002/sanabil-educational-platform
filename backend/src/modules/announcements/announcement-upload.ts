import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { open, unlink } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ApiError } from "../../utils/api-error.js";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const mimeExtensions = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);

export const announcementUploadDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "../../../uploads/announcements");
export const announcementUploadPublicPath = "/uploads/announcements";
mkdirSync(announcementUploadDirectory, { recursive: true });

export type AnnouncementUploadRequest = Request & {
  announcementImageUrl?: string;
  announcementImageCommitted?: boolean;
};

const storage = multer.diskStorage({
  destination: announcementUploadDirectory,
  filename: (_request, file, callback) => { callback(null, `${randomUUID()}${mimeExtensions.get(file.mimetype) ?? ""}`); },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
  fileFilter: (_request, file, callback) => {
    if (!mimeExtensions.has(file.mimetype)) {
      callback(new ApiError(400, "Unsupported announcement image", { image: "Only JPEG, PNG, and WebP images are allowed" }));
      return;
    }
    callback(null, true);
  },
}).single("image");

async function hasValidSignature(path: string, mimeType: string) {
  const handle = await open(path, "r");
  try {
    const bytes = Buffer.alloc(12);
    const { bytesRead } = await handle.read(bytes, 0, bytes.length, 0);
    if (mimeType === "image/jpeg") return bytesRead >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    if (mimeType === "image/png") return bytesRead >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    if (mimeType === "image/webp") return bytesRead >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
    return false;
  } finally {
    await handle.close();
  }
}

async function processUpload(error: unknown, req: AnnouncementUploadRequest, res: Response, next: NextFunction) {
  if (error) {
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      next(new ApiError(400, "Announcement image is too large", { image: "Image size must not exceed 5 MB" }));
      return;
    }
    next(error);
    return;
  }
  const file = req.file;
  if (!file) { next(); return; }
  try {
    if (!await hasValidSignature(file.path, file.mimetype)) {
      await unlink(file.path).catch(() => undefined);
      next(new ApiError(400, "Invalid announcement image", { image: "The uploaded file is not a valid image" }));
      return;
    }
    req.announcementImageUrl = `${announcementUploadPublicPath}/${file.filename}`;
    res.once("finish", () => { if (!req.announcementImageCommitted) void unlink(file.path).catch(() => undefined); });
    next();
  } catch (uploadError) {
    await unlink(file.path).catch(() => undefined);
    next(uploadError);
  }
}

export const uploadAnnouncementImage = (req: AnnouncementUploadRequest, res: Response, next: NextFunction) => {
  upload(req, res, (error) => { void processUpload(error, req, res, next); });
};

export function commitAnnouncementImage(req: AnnouncementUploadRequest) {
  req.announcementImageCommitted = true;
}

export async function deleteAnnouncementUpload(imageUrl: string) {
  if (!imageUrl.startsWith(`${announcementUploadPublicPath}/`)) return;
  const filename = imageUrl.slice(announcementUploadPublicPath.length + 1);
  if (!filename || filename !== filename.replace(/[\\/]/g, "")) return;
  await unlink(resolve(announcementUploadDirectory, filename)).catch(() => undefined);
}
