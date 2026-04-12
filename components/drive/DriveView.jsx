"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Loader2, FolderOpen } from "lucide-react";

import { useDrive } from "@/hooks/use-drive";
import BreadcrumbNav from "./BreadcrumbNav";
import ItemCard from "./ItemCard";
import ItemRow from "./ItemRow";
import ItemContextMenu from "./ItemContextMenu";
import PermissionsDialog from "./PermissionDialog";
import RenameDialog from "./RenameDialog";
import MoveDialog from "./MoveDialog";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import MediaViewer from "./MediaViewer";

export default function DriveView({ folderId }) {
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
    mode,
  } = useDrive();

  const [contextMenu, setContextMenu] = useState(null);
  const [shareItem, setShareItem] = useState(null);
  const [renameItem, setRenameItem] = useState(null);
  const [moveItems, setMoveItems] = useState(null);
  const [deleteItems, setDeleteItems] = useState(null);
  const [mediaItem, setMediaItem] = useState(null);

  const handleOpen = useCallback(
    (item) => {
      if (item.type !== "folder") return;
      if (mode !== "drive") return;

      setCurrentFolderId(item._id);
      router.push(`/drive/${item._id}`);
    },
    [router, setCurrentFolderId, mode]
  );

  const handleContextMenu = useCallback((e, item) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, item });
  }, []);

  const handleAction = useCallback(
    async (action, item) => {
      if (!item) return;

      switch (action) {
        case "share":
          setShareItem(item);
          break;

        case "toggleStar":
          await fetch(`/api/items/${item._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              starred: !item.starredBy?.includes(userId),
            }),
          });
          refreshItems();
          break;

        case "rename":
          setRenameItem(item);
          break;

        case "move":
          setMoveItems([item]);
          break;

        case "copyLink":
          await navigator.clipboard.writeText(
            `${window.location.origin}/api/download/${item._id}?inline=true`
          );
          break;

        case "trash":
          await fetch(`/api/items/${item._id}?q=trash`, {
            method: "PATCH",
            body: JSON.stringify({ isTrashed: true }),
          });
          refreshItems();
          break;

        case "restore":
          await fetch(`/api/items/${item._id}?q=restore`, {
            method: "PATCH",
            body: JSON.stringify({ isTrashed: false }),
          });
          refreshItems();
          break;

        case "deletePermanent":
          setDeleteItems([item]);
          break;

        case "download": {
          const a = document.createElement("a");
          a.href = `/api/download/${item._id}`;
          a.click();
          break;
        }

        case "preview":
          setMediaItem(item);
          break;
      }
    },
    [userId, refreshItems]
  );

  return (
    <div className="flex flex-col h-full" onClick={clearSelection}>
      {/* HEADER */}
      {mode === "drive" && (
        <div className="p-4 border-b">
          <BreadcrumbNav folderId={folderId} />
        </div>
      )}

      {/* CONTENT */}
      <div className="flex-1 p-4 overflow-auto">
        {loading ? (
          <Loader2 className="animate-spin" />
        ) : items.length === 0 ? (
          <div className="text-center flex flex-col items-center gap-2">
            <FolderOpen />
            <p>No items</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {items.map((item) => (
              <ItemCard
                key={item._id}
                item={item}
                selected={selectedItems.includes(item._id)}
                onSelect={toggleSelect}
                onOpen={handleOpen}
                onAction={handleAction}
                onContextMenu={handleContextMenu}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {items.map((item) => (
              <ItemRow
                key={item._id}
                item={item}
                selected={selectedItems.includes(item._id)}
                onSelect={toggleSelect}
                onOpen={handleOpen}
                onAction={handleAction}
                onContextMenu={handleContextMenu}
              />
            ))}
          </div>
        )}
      </div>

      {/* CONTEXT MENU */}
      {contextMenu && (
        <ItemContextMenu
          {...contextMenu}
          isOwner={contextMenu.item?.ownerId === userId}
          mode={mode}
          onClose={() => setContextMenu(null)}
          onAction={(a) => handleAction(a, contextMenu.item)}
        />
      )}

      {/* DIALOGS */}
      <PermissionsDialog
        open={!!shareItem}
        item={shareItem}
        onClose={() => setShareItem(null)}
        onSuccess={refreshItems}
      />

      <RenameDialog
        open={!!renameItem}
        item={renameItem}
        onClose={() => setRenameItem(null)}
        onSuccess={refreshItems}
      />

      <MoveDialog
        open={!!moveItems}
        items={moveItems}
        onClose={() => setMoveItems(null)}
        onSuccess={refreshItems}
      />

      <DeleteConfirmDialog
        open={!!deleteItems}
        items={deleteItems}
        onClose={() => setDeleteItems(null)}
        onConfirm={async () => {
          await Promise.all(
            deleteItems.map((item) =>
              fetch(`/api/items/${item._id}`, { method: "DELETE" })
            )
          );
          setDeleteItems(null);
          refreshItems();
        }}
      />

      <MediaViewer
        open={!!mediaItem}
        item={mediaItem}
        onClose={() => setMediaItem(null)}
      />
    </div>
  );
}