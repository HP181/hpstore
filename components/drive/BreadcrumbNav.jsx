"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, HardDrive } from "lucide-react";

export default function BreadcrumbNav({ folderId }) {
  const [crumbs, setCrumbs] = useState([]);

  useEffect(() => {
    if (!folderId) { setCrumbs([]); return; }
    fetch(`/api/items/${folderId}/breadcrumb`)
      .then((r) => r.json())
      .then((d) => setCrumbs(d.breadcrumbs || []))
      .catch(() => {});
  }, [folderId]);

  return (
    <nav className="flex items-center gap-1 text-sm">
      <Link
        href="/drive"
        className="flex items-center gap-1.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors font-medium"
      >
        <HardDrive size={14} />
        <span>My Drive</span>
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={crumb._id} className="flex items-center gap-1">
          <ChevronRight size={13} className="text-[hsl(var(--muted-foreground))]" />
          {i === crumbs.length - 1 ? (
            <span className="text-[hsl(var(--foreground))] font-medium truncate max-w-32">
              {crumb.name}
            </span>
          ) : (
            <Link
              href={`/drive/${crumb._id}`}
              className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors truncate max-w-24"
            >
              {crumb.name}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}