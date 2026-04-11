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

  useEffect(() => {
  setCurrentFolderId(initialFolderId);
}, [initialFolderId]);


  useEffect(() => {
  setSearch("");
}, [currentFolderId]);

const fetchItems = useCallback(async () => {
  const fetchId = ++fetchRef.current;
  setLoading(true);

  try {
    const params = new URLSearchParams();

    // --------------------
    // MODE FILTERS
    // --------------------
    if (mode === "trash") {
      params.set("trashed", "true");
    } else if (mode === "starred") {
      params.set("starred", "true");
    } else if (mode === "shared") {
      params.set("shared", "true");
    } else {
      params.set("parentId", currentFolderId || "null");
    }

    // --------------------
    // SEARCH
    // --------------------
    if (search?.trim()) {
      params.set("search", search.trim());
    }

    // --------------------
    // FILTER TYPE
    // --------------------
    if (filterType !== "all") {
      params.set("type", filterType);
    }

    // --------------------
    // SORT
    // --------------------
    params.set("sortBy", sortBy);
    params.set("order", sortOrder);

    const res = await fetch(`/api/items?${params.toString()}`);
    const data = await res.json();
    console .log("Fetched items:", data.data);

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
}, [
  currentFolderId,
  search,
  sortBy,
  sortOrder,
  filterType,
  mode,
]);

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