"use client";

import { useState, useRef, useEffect } from "react";
import { UserButton } from "@clerk/nextjs";
import {
  Search,
  Sun,
  Moon,
  Monitor,
  SortAsc,
  SortDesc,
  LayoutGrid,
  List,
  X,
} from "lucide-react";

import { useTheme } from "@/components/ThemeProvider";
import { useDrive } from "@/hooks/use-drive";

export default function Topbar() {
  const { theme, setTheme } = useTheme();

  const {
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    viewMode,
    setViewMode,
    setSearch,
    filterType,
    setFilterType,
  } = useDrive();

  const [searchVal, setSearchVal] = useState("");
  const searchTimeout = useRef(null);

  // -----------------------
  // SEARCH (debounced)
  // -----------------------
  function handleSearch(val) {
    setSearchVal(val);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      setSearch(val);
    }, 350);
  }

  useEffect(() => {
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, []);

  // -----------------------
  // OPTIONS
  // -----------------------
  const themeOptions = [
    { value: "light", icon: Sun },
    { value: "dark", icon: Moon },
    { value: "system", icon: Monitor },
  ];

  const sortOptions = [
    { value: "name", label: "Name" },
    { value: "size", label: "Size" },
    { value: "createdAt", label: "Date Created" },
    { value: "updatedAt", label: "Last Modified" },
  ];

  const typeOptions = [
    { value: "all", label: "All" },
    { value: "folder", label: "Folders" },
    { value: "file", label: "Files" },
  ];

  // -----------------------
  // UI
  // -----------------------
  return (
    <header className="h-14 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] flex items-center px-4 gap-3 shrink-0">
      
      {/* SEARCH */}
      <div className="flex-1 max-w-xl relative">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]"
        />

        <input
          value={searchVal}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search files and folders..."
          className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
        />

        {searchVal && (
          <button
            onClick={() => handleSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* TYPE FILTER */}
      <div className="flex items-center gap-1 border border-[hsl(var(--border))] rounded-lg p-0.5 bg-[hsl(var(--background))]">
        {typeOptions.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilterType(value)}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
              filterType === value
                ? "bg-blue-600 text-white"
                : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* SORT */}
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        className="text-xs border border-[hsl(var(--border))] rounded-lg px-2 py-1.5 bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {sortOptions.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      {/* ORDER */}
      <button
        onClick={() =>
          setSortOrder(sortOrder === "asc" ? "desc" : "asc")
        }
        className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
        title={sortOrder === "asc" ? "Ascending" : "Descending"}
      >
        {sortOrder === "asc" ? (
          <SortAsc size={16} />
        ) : (
          <SortDesc size={16} />
        )}
      </button>

      {/* VIEW MODE */}
      <div className="flex items-center gap-0.5 border border-[hsl(var(--border))] rounded-lg p-0.5 bg-[hsl(var(--background))]">
        <button
          onClick={() => setViewMode("grid")}
          className={`p-1.5 rounded-md transition-colors ${
            viewMode === "grid"
              ? "bg-blue-600 text-white"
              : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          }`}
        >
          <LayoutGrid size={14} />
        </button>

        <button
          onClick={() => setViewMode("list")}
          className={`p-1.5 rounded-md transition-colors ${
            viewMode === "list"
              ? "bg-blue-600 text-white"
              : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          }`}
        >
          <List size={14} />
        </button>
      </div>

      {/* THEME */}
      <div className="flex items-center gap-0.5 border border-[hsl(var(--border))] rounded-lg p-0.5 bg-[hsl(var(--background))]">
        {themeOptions.map(({ value, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={`p-1.5 rounded-md transition-colors ${
              theme === value
                ? "bg-blue-600 text-white"
                : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            }`}
          >
            <Icon size={14} />
          </button>
        ))}
      </div>

      {/* USER */}
      <UserButton afterSignOutUrl="/sign-in" />
    </header>
  );
}