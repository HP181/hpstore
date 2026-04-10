import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";

let bucket;

export function getGridFSBucket() {
  if (!bucket) {
    const db = mongoose.connection.db;
    if (!db) throw new Error("MongoDB not connected");
    bucket = new GridFSBucket(db, { bucketName: "uploads" });
  }
  return bucket;
}

export async function uploadToGridFS(buffer, filename, mimeType) {
  const bucket = getGridFSBucket();
  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: mimeType,
      chunkSizeBytes: 255 * 1024, // 255KB chunks
    });
    uploadStream.on("error", reject);
    uploadStream.on("finish", () => resolve(uploadStream.id));
    uploadStream.end(buffer);
  });
}

export async function getGridFSStream(fileId) {
  const bucket = getGridFSBucket();
  const objectId = new mongoose.Types.ObjectId(fileId);
  return bucket.openDownloadStream(objectId);
}

export async function deleteFromGridFS(fileId) {
  const bucket = getGridFSBucket();
  const objectId = new mongoose.Types.ObjectId(fileId);
  await bucket.delete(objectId);
}