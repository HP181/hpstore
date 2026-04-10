"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Loader2, FolderOpen } from "lucide-react";

import { DriveProvider, useDrive } from "@/hooks/use-drive";
import BreadcrumbNav from "./BreadcrumbNav";
import ItemCard from "./ItemCard";
import ItemRow from "./ItemRow";
import ItemContextMenu from "./ItemContextMenu";
import RenameDialog from "./RenameDialog";
import MoveDialog from "./MoveDialog";
import PermissionsDialog from "./PermissionDialog";
import MediaViewer from "./MediaViewer";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import BulkToolbar from "./BulkToolbar";
import { isPreviewable } from "@/lib/utils";

function DriveContent({ folderId, mode }) {
  const router = useRouter();
  const { userId } = useAuth();

  const {
    items,
    loading,
    viewMode,
    selectedItems,
    toggleSelect,
    clearSelection,
    refreshItems,
    setCurrentFolderId,
  } = useDrive();

  const [contextMenu, setContextMenu] = useState(null);
  const [renameItem, setRenameItem] = useState(null);
  const [moveItems, setMoveItems] = useState(null);
  const [shareItem, setShareItem] = useState(null);
  const [mediaItem, setMediaItem] = useState(null);
  const [deleteItems, setDeleteItems] = useState(null);

  // -----------------------
  // OPEN FOLDER
  // -----------------------
const handleOpen = useCallback((item) => {
  if (item.type !== "folder") return;

  setCurrentFolderId(item._id);

  router.push(`/drive/${item._id}`);
}, [router, setCurrentFolderId]);

  // -----------------------
  // CONTEXT MENU
  // -----------------------
  const handleContextMenu = useCallback((e, item) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, item });
  }, []);

  const handleAction = useCallback(
    async (action, item) => {
      const target = item || contextMenu?.item;
      if (!target) return;

      switch (action) {
        case "preview":
          setMediaItem(target);
          break;

        case "download": {
          const a = document.createElement("a");
          a.href = `/api/download/${target._id}`;
          a.download = target.name;
          a.click();
          break;
        }

        case "rename":
          setRenameItem(target);
          break;

        case "move":
          setMoveItems([target]);
          break;

        case "share":
          setShareItem(target);
          break;

        case "toggleStar":
          await fetch(`/api/items/${target._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              starred: !target.starredBy?.includes(userId),
            }),
          });
          refreshItems();
          break;

        case "trash":
          await fetch(`/api/items/${target._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isTrashed: true }),
          });
          refreshItems();
          break;

        case "restore":
          await fetch(`/api/items/${target._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isTrashed: false }),
          });
          refreshItems();
          break;

        case "deletePermanent":
          setDeleteItems([target]);
          break;

        case "copyLink":
          navigator.clipboard.writeText(
            `${window.location.origin}/api/download/${target._id}?inline=true`
          );
          break;
      }
    },
    [contextMenu, userId, refreshItems]
  );

  // -----------------------
  // BULK ACTIONS
  // -----------------------
  const handleBulkAction = useCallback(
    async (action) => {
      const selected = items.filter((i) =>
        selectedItems.includes(i._id)
      );

      switch (action) {
        case "downloadAll":
          selected.forEach((item) => {
            const a = document.createElement("a");
            a.href = `/api/download/${item._id}`;
            a.download = item.name;
            a.click();
          });
          break;

        case "trashAll":
          await Promise.all(
            selected.map((item) =>
              fetch(`/api/items/${item._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isTrashed: true }),
              })
            )
          );
          clearSelection();
          refreshItems();
          break;

        case "restoreAll":
          await Promise.all(
            selected.map((item) =>
              fetch(`/api/items/${item._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isTrashed: false }),
              })
            )
          );
          clearSelection();
          refreshItems();
          break;

        case "deleteAll":
          setDeleteItems(selected);
          break;
      }
    },
    [items, selectedItems, clearSelection, refreshItems]
  );

  async function handleDeleteConfirm() {
    if (!deleteItems) return;

    await Promise.all(
      deleteItems.map((item) =>
        fetch(`/api/items/${item._id}`, { method: "DELETE" })
      )
    );

    setDeleteItems(null);
    clearSelection();
    refreshItems();
  }

  // -----------------------
  // FILTER PREVIEWABLE
  // -----------------------
  const previewableItems = items.filter(
    (i) => i.type === "file" && isPreviewable(i.mimeType, i.name)
  );

  // -----------------------
  // EMPTY STATE
  // -----------------------
  function EmptyState() {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20">
        <FolderOpen size={40} className="text-muted-foreground mb-3" />
        <p className="text-base font-semibold">This folder is empty</p>
        <p className="text-sm text-muted-foreground mt-1">
          Upload files or create folders to get started
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full w-full overflow-hidden bg-background"
      onClick={() => {
        clearSelection();
        setContextMenu(null);
      }}
    >
      {/* HEADER */}
      <div className="px-6 py-3 border-b border-border shrink-0 bg-card">
        <BreadcrumbNav folderId={folderId} />
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-60">
            <Loader2 className="animate-spin text-blue-500" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* GRID VIEW */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {items.map((item) => (
                  <ItemCard
                    key={item._id}
                    item={item}
                    selected={selectedItems.includes(item._id)}
                    onSelect={toggleSelect}
                    onContextMenu={handleContextMenu}
                    onOpen={handleOpen}
                    onAction={handleAction}
                  />
                ))}
              </div>
            ) : (
              /* LIST VIEW */
              <div className="flex flex-col gap-1">
                {items.map((item) => (
                  <ItemRow
                    key={item._id}
                    item={item}
                    selected={selectedItems.includes(item._id)}
                    onSelect={toggleSelect}
                    onContextMenu={handleContextMenu}
                    onOpen={handleOpen}
                    onAction={handleAction}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* CONTEXT MENU */}
      {contextMenu && (
        <ItemContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          item={contextMenu.item}
          isOwner={contextMenu.item?.ownerId === userId}
          onClose={() => setContextMenu(null)}
          onAction={(action) =>
            handleAction(action, contextMenu.item)
          }
        />
      )}

      {/* BULK TOOLBAR */}
      <BulkToolbar
        count={selectedItems.length}
        onAction={handleBulkAction}
        onClear={clearSelection}
        isTrash={mode === "trash"}
      />

      {/* DIALOGS */}
      <RenameDialog
        open={!!renameItem}
        item={renameItem}
        onClose={() => setRenameItem(null)}
        onSuccess={() => {
          setRenameItem(null);
          refreshItems();
        }}
      />

      <MoveDialog
        open={!!moveItems}
        items={moveItems}
        onClose={() => setMoveItems(null)}
        onSuccess={() => {
          setMoveItems(null);
          clearSelection();
          refreshItems();
        }}
      />

      <PermissionsDialog
        open={!!shareItem}
        item={shareItem}
        onClose={() => setShareItem(null)}
      />

      <DeleteConfirmDialog
        open={!!deleteItems}
        items={deleteItems}
        onClose={() => setDeleteItems(null)}
        onConfirm={handleDeleteConfirm}
      />

      <MediaViewer
        open={!!mediaItem}
        item={mediaItem}
        items={previewableItems}
        onClose={() => setMediaItem(null)}
      />
    </div>
  );
}

// -----------------------
// MAIN EXPORT
// -----------------------
export default function DriveView({ folderId, mode = "drive" }) {
  return (
    <DriveProvider initialFolderId={folderId} mode={mode}>
      <DriveContent folderId={folderId} mode={mode} />
    </DriveProvider>
  );
}