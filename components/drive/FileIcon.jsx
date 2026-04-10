"use client";
import {
  Folder, File, Image, Film, Music, FileText, Archive,
  FileSpreadsheet, Presentation, Code, FileJson
} from "lucide-react";
import { getFileIcon } from "@/lib/utils";
import { cn } from "@/lib/utils";

const FOLDER_COLORS = {
  null: "#4B9CF5",
  blue: "#4B9CF5",
  red: "#EF4444",
  green: "#22C55E",
  yellow: "#EAB308",
  purple: "#A855F7",
  pink: "#EC4899",
  orange: "#F97316",
  teal: "#14B8A6",
};

export default function FileIcon({ item, size = 40, className }) {
  if (item.type === "folder") {
    const color = FOLDER_COLORS[item.color] || FOLDER_COLORS.null;
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        className={className}
      >
        <path
          d="M4 10C4 7.79 5.79 6 8 6H16L20 10H32C34.21 10 36 11.79 36 14V30C36 32.21 34.21 34 32 34H8C5.79 34 4 32.21 4 30V10Z"
          fill={color}
          opacity="0.9"
        />
        <path
          d="M4 16H36V30C36 32.21 34.21 34 32 34H8C5.79 34 4 32.21 4 30V16Z"
          fill={color}
        />
      </svg>
    );
  }

  const type = getFileIcon(item.mimeType, item.name);
  const configs = {
    image:       { Icon: Image,           bg: "#EDE9FE", color: "#7C3AED" },
    video:       { Icon: Film,            bg: "#FEE2E2", color: "#DC2626" },
    audio:       { Icon: Music,           bg: "#DCFCE7", color: "#16A34A" },
    pdf:         { Icon: FileText,        bg: "#FEF3C7", color: "#D97706" },
    word:        { Icon: FileText,        bg: "#DBEAFE", color: "#2563EB" },
    excel:       { Icon: FileSpreadsheet, bg: "#DCFCE7", color: "#16A34A" },
    powerpoint:  { Icon: Presentation,   bg: "#FEE2E2", color: "#DC2626" },
    archive:     { Icon: Archive,         bg: "#F3F4F6", color: "#6B7280" },
    text:        { Icon: FileText,        bg: "#F0FDF4", color: "#15803D" },
    file:        { Icon: File,            bg: "#F3F4F6", color: "#6B7280" },
  };

  const { Icon, bg, color } = configs[type] || configs.file;
  const iconSize = Math.round(size * 0.45);
  const radius = Math.round(size * 0.2);

  return (
    <div
      className={cn("flex items-center justify-center shrink-0", className)}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: bg,
      }}
    >
      <Icon size={iconSize} style={{ color }} strokeWidth={1.8} />
    </div>
  );
}