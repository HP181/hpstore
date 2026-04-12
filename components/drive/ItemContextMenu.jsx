"use client";

import { Share2, Download, Pencil, FolderOpen, Trash2, Copy, Star } from "lucide-react";

export default function ItemContextMenu({
  x,
  y,
  item,
  isOwner,
  onClose,
  onAction,
}) {
  if (!item) return null;

  const menuItems = [
    { action: "download", label: "Download", icon: Download, show: item.type === "file" },
    { action: "preview", label: "Preview", icon: FolderOpen, show: item.type === "file" },
    { action: "toggleStar", label: item.starredBy?.length > 0 ? "Unstar" : "Star", icon: Star },
    { action: "rename", label: "Rename", icon: Pencil, show: isOwner },
    { action: "move", label: "Move", icon: FolderOpen, show: isOwner },
    { action: "share", label: "Share", icon: Share2, show: isOwner },
    { action: "copyLink", label: "Copy Link", icon: Copy },
    { action: "trash", label: "Delete", icon: Trash2, show: isOwner },
  ];

  const visibleItems = menuItems.filter((m) => m.show !== false);

  return (
    <div
      className="fixed z-50 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 min-w-[180px]"
      style={{ top: `${y}px`, left: `${x}px` }}
      onClick={(e) => e.stopPropagation()}
    >
      {visibleItems.map((m) => {
        const Icon = m.icon;
        return (
          <button
            key={m.action}
            onClick={() => {
              onAction(m.action);
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Icon size={16} />
            {m.label}
          </button>
        );
      })}
    </div>
  );
}