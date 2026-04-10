"use client";
import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

export default function DeleteConfirmDialog({ open, items, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleDelete() {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[hsl(var(--card))] rounded-2xl shadow-2xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--border))]">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-500" />
            <h2 className="font-semibold text-[hsl(var(--foreground))]">Delete Permanently</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))]">
            <X size={16} />
          </button>
        </div>
        <div className="p-6">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            This will permanently delete{" "}
            <span className="font-semibold text-[hsl(var(--foreground))]">
              {items?.length === 1 ? `"${items[0]?.name}"` : `${items?.length} items`}
            </span>{" "}
            and all their contents. This action cannot be undone.
          </p>
        </div>
        <div className="px-6 pb-5 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] transition-colors">
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-60"
          >
            {loading ? "Deleting..." : "Delete Forever"}
          </button>
        </div>
      </div>
    </div>
  );
}