"use client";
import { useEffect, useState, useCallback } from "react";
import {
  X, Download, ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  RotateCw, Volume2, VolumeX
} from "lucide-react";
import { getFileIcon } from "@/lib/utils";

export default function MediaViewer({ open, item, items = [], onClose }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (!open || !item || !items.length) return;
    const idx = items.findIndex((i) => i._id === item._id);
    setCurrentIdx(idx >= 0 ? idx : 0);
    setZoom(1);
    setRotation(0);
  }, [open, item, items]);

  const handleKeyDown = useCallback(
    (e) => {
      if (!open) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") navigate(-1);
      if (e.key === "ArrowRight") navigate(1);
    },
    [open, currentIdx, items]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!open || !item) return null;

  const previewableItems = items.filter((i) => {
    const t = getFileIcon(i.mimeType, i.name);
    return ["image", "video", "audio", "pdf"].includes(t);
  });

  const current = previewableItems[currentIdx] || item;
  const fileType = getFileIcon(current.mimeType, current.name);
  const src = `/api/download/${current._id}?inline=true`;

  function navigate(dir) {
    setCurrentIdx((prev) => {
      const next = prev + dir;
      if (next < 0 || next >= previewableItems.length) return prev;
      setZoom(1);
      setRotation(0);
      return next;
    });
  }

  function handleDownload() {
    const a = document.createElement("a");
    a.href = `/api/download/${current._id}`;
    a.download = current.name;
    a.click();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/50 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-white font-medium text-sm truncate max-w-xs">{current.name}</span>
          {previewableItems.length > 1 && (
            <span className="text-white/50 text-xs">
              {currentIdx + 1} / {previewableItems.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {fileType === "image" && (
            <>
              <button onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))} className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                <ZoomOut size={16} />
              </button>
              <span className="text-white/60 text-xs w-10 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom((z) => Math.min(4, z + 0.25))} className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                <ZoomIn size={16} />
              </button>
              <button onClick={() => setRotation((r) => (r + 90) % 360)} className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                <RotateCw size={16} />
              </button>
            </>
          )}
          <button onClick={handleDownload} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors text-sm">
            <Download size={15} />
            Download
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden min-h-0">
        {/* Nav arrows */}
        {currentIdx > 0 && (
          <button
            onClick={() => navigate(-1)}
            className="absolute left-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        {currentIdx < previewableItems.length - 1 && (
          <button
            onClick={() => navigate(1)}
            className="absolute right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        )}

        {/* Media */}
        <div className="flex items-center justify-center w-full h-full p-8">
          {fileType === "image" && (
            <img
              key={current._id}
              src={src}
              alt={current.name}
              className="max-w-full max-h-full object-contain select-none transition-transform duration-200"
              style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
              draggable={false}
            />
          )}

          {fileType === "video" && (
            <video
              key={current._id}
              src={src}
              controls
              autoPlay
              className="max-w-full max-h-full rounded-lg"
              style={{ maxHeight: "calc(100vh - 120px)" }}
            />
          )}

          {fileType === "audio" && (
            <div className="flex flex-col items-center gap-6 bg-white/5 p-10 rounded-2xl border border-white/10">
              <div className="w-24 h-24 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                <Volume2 size={40} className="text-blue-400" />
              </div>
              <div className="text-center">
                <p className="text-white font-semibold text-lg">{current.name}</p>
              </div>
              <audio
                key={current._id}
                src={src}
                controls
                autoPlay
                className="w-72"
              />
            </div>
          )}

          {fileType === "pdf" && (
            <iframe
              key={current._id}
              src={src}
              className="w-full h-full rounded-lg bg-white"
              style={{ maxHeight: "calc(100vh - 120px)", minHeight: "60vh" }}
              title={current.name}
            />
          )}
        </div>
      </div>

      {/* Thumbnail strip for image galleries */}
      {fileType === "image" && previewableItems.length > 1 && (
        <div className="shrink-0 flex gap-2 px-4 py-3 bg-black/50 border-t border-white/10 overflow-x-auto">
          {previewableItems.map((it, idx) => {
            const t = getFileIcon(it.mimeType, it.name);
            if (t !== "image") return null;
            return (
              <button
                key={it._id}
                onClick={() => { setCurrentIdx(idx); setZoom(1); setRotation(0); }}
                className={`shrink-0 w-12 h-12 rounded-md overflow-hidden border-2 transition-all ${
                  idx === currentIdx ? "border-blue-500" : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <img
                  src={`/api/download/${it._id}?inline=true`}
                  alt={it.name}
                  className="w-full h-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}