"use client";
import { Download, Trash2, FolderOpen, X, RotateCcw } from "lucide-react";

export default function BulkToolbar({ count, onAction, onClear, isTrash }) {
  if (count === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-2xl animate-fadeIn">
      <span className="text-sm font-semibold text-[hsl(var(--foreground))] mr-1">
        {count} selected
      </span>

      {isTrash ? (
        <>
          <button
            onClick={() => onAction("restoreAll")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm hover:bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] transition-colors"
          >
            <RotateCcw size={14} />
            Restore
          </button>
          <button
            onClick={() => onAction("deleteAll")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors"
          >
            <Trash2 size={14} />
            Delete Forever
          </button>
        </>
      ) : (
        <>
          <button
            onClick={() => onAction("downloadAll")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm hover:bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] transition-colors"
          >
            <Download size={14} />
            Download
          </button>
          <button
            onClick={() => onAction("moveAll")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm hover:bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] transition-colors"
          >
            <FolderOpen size={14} />
            Move
          </button>
          <button
            onClick={() => onAction("trashAll")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors"
          >
            <Trash2 size={14} />
            Trash
          </button>
        </>
      )}

      <div className="w-px h-5 bg-[hsl(var(--border))]" />
      <button
        onClick={onClear}
        className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}