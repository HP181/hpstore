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

export function DriveProvider({ children, initialFolderId = null }) {
  const pathname = usePathname();

  const mode = pathname?.startsWith("/trash")
    ? "trash"
    : pathname?.startsWith("/starred")
    ? "starred"
    : pathname?.startsWith("/shared")
    ? "shared"
    : "drive";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentFolderId, setCurrentFolderId] = useState(initialFolderId);

  const [search, _setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [viewMode, setViewMode] = useState("grid");
  const [filterType, setFilterType] = useState("all");
  const [selectedItems, setSelectedItems] = useState([]);

  const fetchRef = useRef(0);

  const setSearch = useCallback((val) => {
    _setSearch(val);
  }, []);

  useEffect(() => {
    if (mode !== "drive") {
      setCurrentFolderId(null);
      return;
    }

    const match = pathname?.match(/\/drive\/([^/]+)/);
    setCurrentFolderId(match?.[1] || null);
  }, [pathname, mode]);

  useEffect(() => {
    setSearch("");
  }, [currentFolderId, mode]);

  const toggleSelect = useCallback((id) => {
  setSelectedItems((prev) =>
    prev.includes(id)
      ? prev.filter((x) => x !== id)
      : [...prev, id]
  );
}, []);

const clearSelection = useCallback(() => {
  setSelectedItems([]);
}, []);

const selectAll = useCallback(() => {
  setSelectedItems(items.map((i) => i._id));
}, [items]);

  const fetchItems = useCallback(async () => {
    const fetchId = ++fetchRef.current;
    setLoading(true);

    try {
      const params = new URLSearchParams();

      params.set("mode", mode);

      if (mode === "drive") {
        params.set("parentId", currentFolderId || "null");
      }

      if (search?.trim()) {
        params.set("search", search.trim());
      }

      if (filterType !== "all") {
        params.set("type", filterType);
      }

      params.set("sortBy", sortBy);
      params.set("order", sortOrder);

      const res = await fetch(`/api/items?${params.toString()}`);
      const data = await res.json();

      if (fetchId === fetchRef.current) {
        setItems(data.data || []);
        setSelectedItems([]);
      }
    } finally {
      if (fetchId === fetchRef.current) setLoading(false);
    }
  }, [currentFolderId, search, sortBy, sortOrder, filterType, mode]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

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
  setSelectedItems,

  toggleSelect,
  clearSelection,
  selectAll,

  mode,
  refreshItems: fetchItems,
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