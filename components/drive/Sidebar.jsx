"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  HardDrive, Users, Star, Trash2, Upload, FolderPlus, ChevronRight,
  BarChart2, Image, Film, FileText, Music, Archive
} from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import UploadDialog from "./UploadDialog";
import NewFolderDialog from "./NewFolderDialog";
import { useDrive } from "@/hooks/use-drive";

const navItems = [
  { href: "/drive", label: "My Drive", icon: HardDrive },
  { href: "/shared", label: "Shared with me", icon: Users },
  { href: "/starred", label: "Starred", icon: Star },
  { href: "/trash", label: "Trash", icon: Trash2 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [storage, setStorage] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const { currentFolderId, refreshItems } = useDrive();

  useEffect(() => {
    fetch("/api/storagestats")
      .then((r) => r.json())
      .then((d) => setStorage(d))
      .catch(() => {});
  }, []);

  const usedPct = storage ? Math.min((storage.totalSize / storage.limit) * 100, 100) : 0;

  const categoryIcons = [
    { key: "images", label: "Images", icon: Image, color: "text-purple-500" },
    { key: "videos", label: "Videos", icon: Film, color: "text-red-500" },
    { key: "audio", label: "Audio", icon: Music, color: "text-green-500" },
    { key: "documents", label: "Documents", icon: FileText, color: "text-blue-500" },
    { key: "others", label: "Others", icon: Archive, color: "text-gray-500" },
  ];

  return (
    <>
      <aside className="w-64 h-full border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] flex flex-col shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-[hsl(var(--border))]">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <HardDrive size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold text-[hsl(var(--foreground))]">NexDrive</span>
        </div>

        {/* Action Buttons */}
        <div className="px-3 py-3 flex flex-col gap-2">
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors w-full"
          >
            <Upload size={15} />
            Upload Files
          </button>
          <button
            onClick={() => setShowNewFolder(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] text-sm font-medium transition-colors w-full"
          >
            <FolderPlus size={15} />
            New Folder
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/drive" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5",
                  active
                    ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400"
                    : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]"
                )}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Storage Stats */}
        {storage && (
          <div className="px-4 py-4 border-t border-[hsl(var(--border))]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Storage</span>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">
                {formatBytes(storage.totalSize)} / {formatBytes(storage.limit)}
              </span>
            </div>
            <div className="w-full h-1.5 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all"
                style={{ width: `${usedPct}%` }}
              />
            </div>
            <div className="mt-3 space-y-1.5">
              {categoryIcons.map(({ key, label, icon: Icon, color }) =>
                storage.categories[key] > 0 ? (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <Icon size={11} className={color} />
                      <span className="text-[hsl(var(--muted-foreground))]">{label}</span>
                    </div>
                    <span className="text-[hsl(var(--muted-foreground))]">
                      {formatBytes(storage.categories[key])}
                    </span>
                  </div>
                ) : null
              )}
            </div>
          </div>
        )}
      </aside>

      <UploadDialog
        open={showUpload}
        onClose={() => setShowUpload(false)}
        folderId={currentFolderId}
        onSuccess={() => { refreshItems(); setShowUpload(false); }}
      />
      <NewFolderDialog
        open={showNewFolder}
        onClose={() => setShowNewFolder(false)}
        parentId={currentFolderId}
        onSuccess={() => { refreshItems(); setShowNewFolder(false); }}
      />
    </>
  );
}