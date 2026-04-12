"use client";
import { useState } from "react";
import { FolderPlus, X } from "lucide-react";

const COLORS = [
  { value: "blue",   label: "Blue",   hex: "#4B9CF5" }, 
  { value: "red",    label: "Red",    hex: "#EF4444" },
  { value: "green",  label: "Green",  hex: "#22C55E" },
  { value: "yellow", label: "Yellow", hex: "#EAB308" },
  { value: "purple", label: "Purple", hex: "#A855F7" },
  { value: "pink",   label: "Pink",   hex: "#EC4899" },
  { value: "orange", label: "Orange", hex: "#F97316" },
  { value: "teal",   label: "Teal",   hex: "#14B8A6" },
];

export default function NewFolderDialog({ open, onClose, parentId, onSuccess }) {
  const [name, setName] = useState("Untitled folder");
const [color, setColor] = useState(COLORS[0].value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function handleCreate() {
    if (!name.trim()) { setError("Folder name is required"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), type: "folder", parentId: parentId || null, color }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create folder");
      setName("Untitled folder");
      setColor(null);
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
            <FolderPlus size={18} className="text-blue-600" />
            <h2 className="font-semibold text-[hsl(var(--foreground))]">New Folder</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))]">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-[hsl(var(--foreground))] block mb-1.5">
              Folder Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
              onFocus={(e) => e.target.select()}
              className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-[hsl(var(--foreground))] block mb-2">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={String(c.value)}
                  onClick={() => setColor(c.value)}
                  className="relative w-7 h-7 rounded-full transition-transform hover:scale-110"
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                >
                  {color === c.value && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 pb-5 flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}