"use client";
import { useState, useEffect } from "react";
import { Pencil, X } from "lucide-react";

export default function RenameDialog({ open, item, onClose, onSuccess }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (item) setName(item.name); }, [item]);

  if (!open || !item) return null;

  async function handleRename() {
    if (!name.trim()) { setError("Name is required"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/items/${item._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to rename");
      onSuccess?.(data.item);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[hsl(var(--card))] rounded-2xl shadow-2xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--border))]">
          <div className="flex items-center gap-2">
            <Pencil size={16} className="text-blue-600" />
            <h2 className="font-semibold text-[hsl(var(--foreground))]">Rename</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))]">
            <X size={16} />
          </button>
        </div>
        <div className="p-6">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
            autoFocus
            onFocus={(e) => {
              const dotIdx = e.target.value.lastIndexOf(".");
              if (dotIdx > 0 && item.type === "file") {
                e.target.setSelectionRange(0, dotIdx);
              } else {
                e.target.select();
              }
            }}
            className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
          />
          {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
        </div>
        <div className="px-6 pb-5 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] transition-colors">
            Cancel
          </button>
          <button onClick={handleRename} disabled={loading} className="px-4 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-60">
            {loading ? "Saving..." : "Rename"}
          </button>
        </div>
      </div>
    </div>
  );
}