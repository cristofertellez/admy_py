"use client";

import { useState } from "react";
import { GlobalSearchDialog } from "@/components/shared/global-search";
import { logout } from "@/actions/auth";

export function DashboardHeaderActions() {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowSearch(true)}
        className="flex items-center gap-2 rounded-md border border-hairline bg-surface-card px-3 py-1.5 text-body-sm text-muted hover:text-body-strong hover:border-hairline-strong transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="hidden sm:inline">Search...</span>
      </button>
      <form action={logout}>
        <button type="submit" className="text-body-sm text-muted hover:text-body-strong transition-colors">
          Sign Out
        </button>
      </form>
      {showSearch && <GlobalSearchDialog onClose={() => setShowSearch(false)} />}
    </>
  );
}
