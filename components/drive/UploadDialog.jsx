"use client";
import { useCallback, useState, useRef } from "react";
import { Upload, X, CheckCircle2, AlertCircle, File } from "lucide-react";
import { formatBytes } from "@/lib/utils";

function ProgressBar({ value }) {
  return (
    <div className="w-full h-1.5 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
      <div
        className="h-full bg-blue-600 rounded-full transition-all duration-300"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export default function UploadDialog({ open, onClose, folderId, onSuccess }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef();

  const addFiles = useCallback((newFiles) => {
    const fileArray = Array.from(newFiles).map((f) => ({
      file: f,
      id: Math.random().toString(36).slice(2),
      progress: 0,
      status: "pending",
      error: null,
    }));
    setFiles((prev) => [...prev, ...fileArray]);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const removeFile = (id) => {
    if (!uploading) setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const uploadAll = async () => {
    setUploading(true);
    let allSuccess = true;

    for (const fileItem of files) {
      if (fileItem.status === "done") continue;

      setFiles((prev) =>
        prev.map((f) => (f.id === fileItem.id ? { ...f, status: "uploading", progress: 0 } : f))
      );

      try {
        const formData = new FormData();
        formData.append("file", fileItem.file);
        if (folderId) formData.append("parentId", folderId);

        // Use XMLHttpRequest for progress tracking
        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", "/api/upload");

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              setFiles((prev) =>
                prev.map((f) => (f.id === fileItem.id ? { ...f, progress: pct } : f))
              );
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              setFiles((prev) =>
                prev.map((f) => (f.id === fileItem.id ? { ...f, status: "done", progress: 100 } : f))
              );
              resolve();
            } else {
              reject(new Error(`Upload failed: ${xhr.statusText}`));
            }
          };

          xhr.onerror = () => reject(new Error("Network error"));
          xhr.send(formData);
        });
      } catch (err) {
        allSuccess = false;
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id ? { ...f, status: "error", error: err.message } : f
          )
        );
      }
    }

    setUploading(false);
    if (allSuccess) {
      setTimeout(() => {
        setFiles([]);
        onSuccess?.();
      }, 800);
    }
  };

  const pendingCount = files.filter((f) => f.status !== "done").length;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[hsl(var(--card))] rounded-2xl shadow-2xl w-full max-w-lg mx-4 flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--border))]">
          <div className="flex items-center gap-2">
            <Upload size={18} className="text-blue-600" />
            <h2 className="font-semibold text-[hsl(var(--foreground))]">Upload Files</h2>
          </div>
          <button
            onClick={() => { if (!uploading) { setFiles([]); onClose(); } }}
            className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Drop zone */}
        <div className="p-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragOver
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                : "border-[hsl(var(--border))] hover:border-blue-400 hover:bg-[hsl(var(--accent))]"
            }`}
          >
            <Upload size={28} className="mx-auto mb-3 text-[hsl(var(--muted-foreground))]" />
            <p className="text-sm font-medium text-[hsl(var(--foreground))]">
              Drop files here or <span className="text-blue-600">browse</span>
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
              Any file type — large files supported
            </p>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
          </div>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-2">
            {files.map((f) => (
              <div key={f.id} className="flex items-center gap-3 p-3 rounded-lg bg-[hsl(var(--accent))]">
                <File size={18} className="text-[hsl(var(--muted-foreground))] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[hsl(var(--foreground))] truncate">{f.file.name}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{formatBytes(f.file.size)}</p>
                  {f.status === "uploading" && <ProgressBar value={f.progress} />}
                  {f.status === "error" && (
                    <p className="text-xs text-red-500 mt-0.5">{f.error}</p>
                  )}
                </div>
                <div className="shrink-0">
                  {f.status === "done" && <CheckCircle2 size={18} className="text-green-500" />}
                  {f.status === "error" && <AlertCircle size={18} className="text-red-500" />}
                  {f.status === "pending" && !uploading && (
                    <button onClick={() => removeFile(f.id)} className="text-[hsl(var(--muted-foreground))] hover:text-red-500">
                      <X size={16} />
                    </button>
                  )}
                  {f.status === "uploading" && (
                    <span className="text-xs text-blue-600 font-medium">{f.progress}%</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[hsl(var(--border))] flex items-center justify-between gap-3">
          <span className="text-sm text-[hsl(var(--muted-foreground))]">
            {files.length} file{files.length !== 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => { if (!uploading) { setFiles([]); onClose(); } }}
              disabled={uploading}
              className="px-4 py-2 rounded-lg text-sm border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={uploadAll}
              disabled={uploading || files.length === 0 || pendingCount === 0}
              className="px-4 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50"
            >
              {uploading ? "Uploading..." : `Upload ${pendingCount > 0 ? pendingCount : ""} File${pendingCount !== 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}