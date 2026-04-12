"use client";

import { Star, MoreVertical } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import FileIcon from "./FileIcon";
import {
  formatBytes,
  formatDate,
  getFileIcon,
  isPreviewable,
} from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function ItemCard({
  item,
  selected = false,
  onSelect,
  onContextMenu,
  onOpen,
  onAction,
}) {
  const { userId } = useAuth();

  const isStarred = item.starredBy?.includes(userId);
  const fileType = getFileIcon(item.mimeType, item.name);
  const canPreview =
    item.type === "file" &&
    isPreviewable(item.mimeType, item.name);

  // -----------------------
  // CLICK HANDLER
  // -----------------------
  function handleClick(e) {
    if (e.ctrlKey || e.metaKey) {
      e.stopPropagation();
      onSelect?.(item._id);
      return;
    }

    if (item.type === "folder") {
      onOpen?.(item);
      return;
    }

    if (canPreview) {
      onAction?.("preview", item);
    }
  }

  function handleDblClick() {
    if (item.type === "folder") onOpen?.(item);
    else if (canPreview) onAction?.("preview", item);
  }

  function handleContextMenu(e) {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu?.(e, item); // ✅ SAFE
  }

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-xl border transition-all cursor-pointer select-none",
        "hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800",
        selected
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-md"
          : "border-[hsl(var(--border))] bg-[hsl(var(--card))]"
      )}
      onClick={handleClick}
      onDoubleClick={handleDblClick}
      onContextMenu={handleContextMenu}
    >
      {/* Checkbox */}
      <div
        className={cn(
          "absolute top-2 left-2 z-10 transition-opacity",
          selected
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100"
        )}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.(item._id);
        }}
      >
        <div
          className={cn(
            "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors",
            selected
              ? "bg-blue-600 border-blue-600"
              : "border-[hsl(var(--border))] bg-[hsl(var(--card))]"
          )}
        >
          {selected && (
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
            >
              <path
                d="M2 5L4.2 7.2L8 3"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Star */}
      {isStarred && (
        <div className="absolute top-2 right-8 z-10">
          <Star
            size={12}
            fill="#EAB308"
            className="text-yellow-500"
          />
        </div>
      )}

      {/* More menu */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onContextMenu?.(e, item); // ✅ FIXED
        }}
        className="absolute top-1.5 right-1.5 z-10 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))] transition-all"
      >
        <MoreVertical size={14} />
      </button>

      {/* Icon / Thumbnail */}
      <div className="flex items-center justify-center pt-6 pb-3 px-4">
        {item.type === "file" && fileType === "image" ? (
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-[hsl(var(--muted))]">
            <img
              src={`/api/download/${item._id}?inline=true`}
              alt={item.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        ) : (
          <FileIcon item={item} size={52} />
        )}
      </div>

      {/* Info */}
      <div className="px-3 pb-3">
        <p
          className="text-sm font-medium text-[hsl(var(--foreground))] truncate"
          title={item.name}
        >
          {item.name}
        </p>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
          {item.type === "file"
            ? formatBytes(item.size)
            : "Folder"}{" "}
          · {formatDate(item.updatedAt)}
        </p>
      </div>
    </div>
  );
}