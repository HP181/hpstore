"use client";
import { useState, useEffect } from "react";
import { FolderOpen, ChevronRight, X, FolderIcon, Loader2 } from "lucide-react";

function FolderNode({ folder, selectedId, onSelect, excludeId, level = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState([]);
  const [loaded, setLoaded] = useState(false);

  async function loadChildren() {
    if (loaded) { setExpanded((e) => !e); return; }
    const res = await fetch(`/api/items?parentId=${folder._id}&type=folder`);
    const data = await res.json();
    setChildren((data.items || []).filter((f) => f._id !== excludeId));
    setLoaded(true);
    setExpanded(true);
  }

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer text-sm transition-colors ${
          selectedId === folder._id
            ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400"
            : "hover:bg-[hsl(var(--accent))] text-[hsl(var(--foreground))]"
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onSelect(folder._id)}
      >
        <button
          onClick={(e) => { e.stopPropagation(); loadChildren(); }}
          className="p-0.5 hover:bg-[hsl(var(--muted))] rounded"
        >
          <ChevronRight size={12} className={`transition-transform ${expanded ? "rotate-90" : ""} text-[hsl(var(--muted-foreground))]`} />
        </button>
        <FolderIcon size={15} className="text-blue-500 shrink-0" />
        <span className="truncate">{folder.name}</span>
      </div>
      {expanded && children.map((child) => (
        <FolderNode
          key={child._id}
          folder={child}
          selectedId={selectedId}
          onSelect={onSelect}
          excludeId={excludeId}
          level={level + 1}
        />
      ))}
    </div>
  );
}

export default function MoveDialog({ open, items, onClose, onSuccess }) {
  const [folders, setFolders] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFetching(true);
    fetch("/api/items?parentId=null&type=folder")
      .then((r) => r.json())
      .then((d) => {
        const excludeIds = new Set(items.map((i) => i._id));
        setFolders((d.items || []).filter((f) => !excludeIds.has(f._id)));
      })
      .finally(() => setFetching(false));
  }, [open, items]);

  if (!open) return null;

  async function handleMove() {
    setLoading(true);
    try {
      await Promise.all(
        items.map((item) =>
          fetch(`/api/items/${item._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ parentId: selectedId }),
          })
        )
      );
      onSuccess?.();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[hsl(var(--card))] rounded-2xl shadow-2xl w-full max-w-sm mx-4 flex flex-col max-h-[70vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--border))]">
          <div className="flex items-center gap-2">
            <FolderOpen size={18} className="text-blue-600" />
            <h2 className="font-semibold text-[hsl(var(--foreground))]">
              Move {items?.length} item{items?.length !== 1 ? "s" : ""}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))]">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {/* Root option */}
          <div
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-sm transition-colors mb-1 ${
              selectedId === null
                ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400"
                : "hover:bg-[hsl(var(--accent))] text-[hsl(var(--foreground))]"
            }`}
            onClick={() => setSelectedId(null)}
          >
            <FolderOpen size={15} className="text-blue-500 ml-4" />
            <span>My Drive (root)</span>
          </div>

          {fetching ? (
            <div className="flex justify-center py-4">
              <Loader2 size={18} className="animate-spin text-[hsl(var(--muted-foreground))]" />
            </div>
          ) : (
            folders.map((f) => (
              <FolderNode
                key={f._id}
                folder={f}
                selectedId={selectedId}
                onSelect={setSelectedId}
                excludeId={items?.[0]?._id}
              />
            ))
          )}
        </div>

        <div className="px-6 py-4 border-t border-[hsl(var(--border))] flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] transition-colors">
            Cancel
          </button>
          <button
            onClick={handleMove}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-60"
          >
            {loading ? "Moving..." : "Move Here"}
          </button>
        </div>
      </div>
    </div>
  );
}