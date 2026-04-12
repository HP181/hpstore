"use client";

import { useState, useEffect } from "react";
import { X, Trash2, Share2, Copy, Check } from "lucide-react";

export default function PermissionDialog({ open, item, onClose, onSuccess }) {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // 🔍 Search state
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    targetUserEmail: "",
    targetUserName: "",
    targetUserId: "",
    role: "viewer",
  });

  const [submitting, setSubmitting] = useState(false);

  // ========================
  // FETCH PERMISSIONS
  // ========================
  useEffect(() => {
    if (!open || !item?._id) return;
    fetchPermissions();
  }, [open, item]);

  async function fetchPermissions() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/items/${item._id}/permissions`);
      if (!res.ok) throw new Error("Failed to load permissions");

      const data = await res.json();
      console.log("dddd",data);
      setPermissions(data.permissions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ========================
  // USER SEARCH (debounced)
  // ========================
  useEffect(() => {
    if (!search) {
      setResults([]);
      return;
    }

    const delay = setTimeout(async () => {
      const res = await fetch(`/api/users/search?q=${search}`);
      const data = await res.json();
      setResults(data.users || []);
    }, 300);

    return () => clearTimeout(delay);
  }, [search]);

  // ========================
  // ADD PERMISSION
  // ========================
  async function handleAddPermission(e) {
    e.preventDefault();

    if (!formData.targetUserId) {
      setError("Please select a user");
      return;
    }

    // 🚫 prevent duplicate
    if (permissions.some(p => p.userId === formData.targetUserId)) {
      setError("User already has access");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const res = await fetch(`/api/items/${item._id}/permissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPermissions(data.permissions || []);

      // reset
      setFormData({
        targetUserEmail: "",
        targetUserName: "",
        targetUserId: "",
        role: "viewer",
      });
      setSearch("");
      setResults([]);

      onSuccess?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // ========================
  // REMOVE
  // ========================
  async function handleRemovePermission(targetUserId) {
    try {
      const res = await fetch(`/api/items/${item._id}/permissions`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPermissions(data.permissions || []);
      onSuccess?.();
    } catch (err) {
      setError(err.message);
    }
  }

  // ========================
  // CHANGE ROLE
  // ========================
  async function handleChangeRole(targetUserId, role) {
    const perm = permissions.find(p => p.userId === targetUserId);
    if (!perm) return;

    try {
      const res = await fetch(`/api/items/${item._id}/permissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId,
          targetUserEmail: perm.userEmail,
          targetUserName: perm.userName,
          role,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPermissions(data.permissions || []);
      onSuccess?.();
    } catch (err) {
      setError(err.message);
    }
  }

  // ========================
  // COPY LINK
  // ========================
  function copyShareLink() {
    const link = `${window.location.origin}/shared/${item._id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-slate-900 rounded-lg w-full max-w-md mx-4">

        {/* HEADER */}
        <div className="flex justify-between p-4 border-b">
          <h2 className="font-semibold flex items-center gap-2">
            <Share2 size={18} /> Share
          </h2>
          <button onClick={onClose}><X /></button>
        </div>

        <div className="p-4 space-y-4">

          {/* ERROR */}
          {error && <div className="text-red-500 text-sm">{error}</div>}

          {/* SHARE LINK */}
          <div className="flex gap-2">
            <input
              readOnly
              value={`${window.location.origin}/shared/${item._id}`}
              className="flex-1 border px-2 py-1 rounded"
            />
            <button onClick={copyShareLink}>
              {copied ? <Check /> : <Copy />}
            </button>
          </div>

          {/* 🔍 SEARCH USER */}
          <div className="relative">
            <input
              placeholder="Search user by email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border px-2 py-2 rounded"
            />

            {results.length > 0 && (
              <div className="absolute w-full bg-black border rounded mt-1 shadow z-10">
                {results.map(user => (
                  <div
                    key={user.id}
                    onClick={() => {
                      setFormData({
                        targetUserId: user.id,
                        targetUserEmail: user.email,
                        targetUserName: user.name,
                        role: "viewer",
                      });
                      setSearch(user.email);
                      setResults([]);
                    }}
                    className="p-2 hover:cursor-pointer"
                  >
                    {user.name || user.email}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ROLE + ADD */}
          <form onSubmit={handleAddPermission} className="flex gap-2">
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              className="border px-2 py-2 rounded"
            >
              <option value="viewer" className="bg-white dark:bg-slate-900">Viewer</option>
              <option value="editor" className="bg-white dark:bg-slate-900">Editor</option>
            </select>

            <button
              disabled={submitting}
              className="bg-blue-600 text-white px-3 rounded"
            >
              Add
            </button>
          </form>

          {/* LIST */}
          {loading ? (
            <p>Loading...</p>
          ) : (
            permissions.map((perm) => (
              <div key={perm.userId} className="flex items-center gap-2">
                <span className="flex-1 text-sm">
                  {console.log(perm)}
                  {perm.userName || perm.userEmail || "abc"}
                </span>

                <select
                  value={perm.role}
                  onChange={(e) =>
                    handleChangeRole(perm.userId, e.target.value)
                  }
                  className="border px-1 text-sm"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                </select>

                <button onClick={() => handleRemovePermission(perm.userId)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}