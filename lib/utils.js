import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes, decimals = 2) {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getFileIcon(mimeType, name) {
  if (!mimeType && name) {
    const ext = name.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "image";
    if (["mp4", "webm", "mov", "avi"].includes(ext)) return "video";
    if (["mp3", "wav", "ogg", "flac"].includes(ext)) return "audio";
    if (["pdf"].includes(ext)) return "pdf";
    if (["doc", "docx"].includes(ext)) return "word";
    if (["xls", "xlsx"].includes(ext)) return "excel";
    if (["ppt", "pptx"].includes(ext)) return "powerpoint";
    if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "archive";
    return "file";
  }
  if (!mimeType) return "file";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.includes("word") || mimeType.includes("document")) return "word";
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "excel";
  if (mimeType.includes("powerpoint") || mimeType.includes("presentation")) return "powerpoint";
  if (mimeType.includes("zip") || mimeType.includes("compressed") || mimeType.includes("archive")) return "archive";
  if (mimeType.includes("text/")) return "text";
  return "file";
}

export function isPreviewable(mimeType, name) {
  const type = getFileIcon(mimeType, name);
  return ["image", "video", "audio", "pdf"].includes(type);
}