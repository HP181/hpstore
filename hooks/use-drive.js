"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { usePathname } from "next/navigation";

const DriveContext = createContext(null);

export function DriveProvider({
  children,
  initialFolderId = null,
  mode = "drive",
}) {
  const pathname = usePathname(); // ✅ FIX: moved inside component

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentFolderId, setCurrentFolderId] = useState(initialFolderId);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [viewMode, setViewMode] = useState("grid");
  const [filterType, setFilterType] = useState("all");

  const [selectedItems, setSelectedItems] = useState([]);

  const fetchRef = useRef(0);

  // ✅ FIX: sync URL → folderId properly
  useEffect(() => {
    const match = pathname?.match(/\/drive\/([^/]+)/);

    if (match?.[1]) {
      setCurrentFolderId(match[1]);
    } else {
      setCurrentFolderId(null);
    }
  }, [pathname]);

  const fetchItems = useCallback(async () => {
    const fetchId = ++fetchRef.current;

    setLoading(true);

    try {
      const params = new URLSearchParams();

      // mode filters
      if (mode === "trash") params.set("trashed", "true");
      if (mode === "starred") params.set("starred", "true");
      if (mode === "shared") params.set("shared", "true");

      // ✅ FIX: folder logic
      if (mode === "drive") {
        if (currentFolderId) {
          params.set("parentId", currentFolderId);
        } else {
          params.set("parentId", "null");
        }
      }

      // search + filters
      if (search) params.set("search", search);
      if (filterType !== "all") params.set("type", filterType);

      params.set("sortBy", sortBy);
      params.set("order", sortOrder);

      const res = await fetch(`/api/items?${params.toString()}`);
      const data = await res.json();

      if (fetchId === fetchRef.current) {
        setItems(data.data || []);
        setSelectedItems([]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      if (fetchId === fetchRef.current) {
        setLoading(false);
      }
    }
  }, [currentFolderId, search, sortBy, sortOrder, filterType, mode]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const refreshItems = useCallback(() => fetchItems(), [fetchItems]);

  const toggleSelect = useCallback((id) => {
    setSelectedItems((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id]
    );
  }, []);

  const selectAll = useCallback(() => {
    setSelectedItems(items.map((i) => i._id));
  }, [items]);

  const clearSelection = useCallback(() => setSelectedItems([]), []);

  return (
    <DriveContext.Provider
      value={{
        items,
        loading,

        currentFolderId,
        setCurrentFolderId,

        search,
        setSearch,

        sortBy,
        setSortBy,

        sortOrder,
        setSortOrder,

        viewMode,
        setViewMode,

        filterType,
        setFilterType,

        selectedItems,
        toggleSelect,
        selectAll,
        clearSelection,

        refreshItems,
        mode,
      }}
    >
      {children}
    </DriveContext.Provider>
  );
}

export function useDrive() {
  const ctx = useContext(DriveContext);
  if (!ctx) throw new Error("useDrive must be used inside DriveProvider");
  return ctx;
}