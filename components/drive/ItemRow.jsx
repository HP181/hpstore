"use client";
import { Star, MoreVertical, Users } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import FileIcon from "./FileIcon";
import { formatBytes, formatDate, getFileIcon, isPreviewable } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function ItemRow({
  item, selected, onSelect, onContextMenu, onOpen, onAction
}) {
  const { userId } = useAuth();
  const isStarred = item.starredBy?.includes(userId);
  const isShared = item.permissions?.length > 1;
  const canPreview = item.type === "file" && isPreviewable(item.mimeType, item.name);
  const fileType = getFileIcon(item.mimeType, item.name);

  function handleClick(e) {
    if (e.ctrlKey || e.metaKey) { onSelect(item._id); return; }
  }

  function handleDblClick() {
    if (item.type === "folder") onOpen(item);
    else if (canPreview) onAction("preview", item);
  }

  function handleContextMenu(e) {
    e.preventDefault();
    onContextMenu(e, item);
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors cursor-pointer select-none",
        selected
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
          : "border-transparent hover:bg-[hsl(var(--accent))] hover:border-[hsl(var(--border))]"
      )}
      onClick={handleClick}
      onDoubleClick={handleDblClick}
      onContextMenu={handleContextMenu}
    >
      {/* Checkbox */}
      <div
        onClick={(e) => { e.stopPropagation(); onSelect(item._id); }}
        className="shrink-0"
      >
        <div className={cn(
          "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors",
          selected ? "bg-blue-600 border-blue-600" : "border-[hsl(var(--border))]"
        )}>
          {selected && (
            <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
              <path d="M2 5L4.2 7.2L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
      </div>

      {/* Icon */}
      {item.type === "file" && fileType === "image" ? (
        <div className="w-8 h-8 rounded-lg overflow-hidden bg-[hsl(var(--muted))] shrink-0">
          <img
            src={`/api/download/${item._id}?inline=true`}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        </div>
      ) : (
        <FileIcon item={item} size={32} className="shrink-0" />
      )}

      {/* Name */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className="text-sm font-medium text-[hsl(var(--foreground))] truncate">{item.name}</span>
        {isStarred && <Star size={11} fill="#EAB308" className="text-yellow-500 shrink-0" />}
        {isShared && <Users size={11} className="text-[hsl(var(--muted-foreground))] shrink-0" />}
      </div>

      {/* Type */}
      <div className="w-20 text-xs text-[hsl(var(--muted-foreground))] hidden md:block shrink-0">
        {item.type === "folder" ? "Folder" : (item.mimeType?.split("/")[1]?.toUpperCase() || "File")}
      </div>

      {/* Size */}
      <div className="w-20 text-xs text-[hsl(var(--muted-foreground))] text-right shrink-0">
        {item.type === "file" ? formatBytes(item.size) : "—"}
      </div>

      {/* Date */}
      <div className="w-28 text-xs text-[hsl(var(--muted-foreground))] text-right shrink-0 hidden lg:block">
        {formatDate(item.updatedAt)}
      </div>

      {/* Actions */}
      <button
        onClick={(e) => { e.stopPropagation(); onContextMenu({ clientX: e.clientX, clientY: e.clientY }, item); }}
        className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] transition-all shrink-0"
      >
        <MoreVertical size={14} />
      </button>
    </div>
  );
}