"use client";

import Link from "next/link";
import { getRecentHref, listRecentItems } from "@/lib/recent";

/** Historia 14.6 — quick links to the recently viewed (cached) pages. */
export function OfflineRecents() {
  const items = listRecentItems();

  if (items.length === 0) {
    return (
      <p className="mt-4 max-w-md text-center text-caption text-muted-soft">
        Recently viewed projects and tasks will appear here for quick offline access.
      </p>
    );
  }

  return (
    <div className="mt-6 w-full max-w-md">
      <h2 className="mb-2 text-center text-caption-uppercase text-muted">Recently viewed</h2>
      <ul className="divide-y divide-hairline rounded-lg border border-hairline bg-surface-card">
        {items.map((item) => (
          <li key={`${item.type}-${item.id}`}>
            <Link
              href={getRecentHref(item)}
              className="flex items-center justify-between px-4 py-2.5 text-body-sm text-body-strong hover:bg-surface-card-elevated"
            >
              <span className="truncate">{item.title}</span>
              <span className="text-caption text-muted">{item.type}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
