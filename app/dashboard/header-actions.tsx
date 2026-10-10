"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { GlobalSearchDialog } from "@/components/shared/global-search";

interface DashboardHeaderActionsProps {
  user?: {
    first_name: string;
    last_name: string;
    email: string;
    avatar?: string | null;
  } | null;
}

export function DashboardHeaderActions({ user }: DashboardHeaderActionsProps) {
  const [showSearch, setShowSearch] = useState(false);

  // Shortcut ⌘F / ⌘K to open search dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "f" || e.key === "k")) {
        e.preventDefault();
        setShowSearch((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const fullName = user ? `${user.first_name} ${user.last_name}`.trim() : "Totok Michael";
  const email = user?.email || "tmichael20@gmail.com";
  const initials = user
    ? `${user.first_name[0] || ""}${user.last_name[0] || ""}`.toUpperCase() || "TM"
    : "TM";

  return (
    <div className="flex items-center gap-3 sm:gap-4">
      {/* 1. SEARCH PILL (matching image) */}
      <button
        type="button"
        onClick={() => setShowSearch(true)}
        className="flex items-center justify-between gap-3 rounded-full border border-hairline/80 bg-surface-card px-4 py-2 text-xs text-muted transition-colors hover:border-hairline-strong hover:text-ink w-48 sm:w-60 md:w-72"
        aria-label="Search task"
      >
        <div className="flex items-center gap-2.5 truncate">
          <svg className="h-4 w-4 shrink-0 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="truncate">Search task</span>
        </div>
        <kbd className="inline-flex shrink-0 items-center rounded-full border border-hairline bg-surface-card-elevated px-2 py-0.5 text-[10px] font-semibold text-muted">
          ⌘ F
        </kbd>
      </button>

      {/* 2. MESSAGES / MAIL ICON BUTTON */}
      <Link
        href="/dashboard/notifications"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline bg-surface-card text-muted transition-colors hover:border-hairline-strong hover:bg-surface-card-elevated hover:text-ink"
        aria-label="Messages"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </Link>

      {/* 3. USER PROFILE CHIP (matching image) */}
      <Link
        href="/dashboard/profile"
        className="flex items-center gap-2.5 rounded-full border border-hairline/70 bg-surface-card/60 p-1 pr-3 transition-colors hover:border-hairline-strong hover:bg-surface-card"
        title="View Profile"
      >
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={fullName}
            className="h-8 w-8 rounded-full object-cover border border-hairline"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-950/80 border border-emerald-700/50 text-xs font-bold text-emerald-200">
            {initials}
          </div>
        )}
        <div className="hidden sm:block text-left leading-tight">
          <p className="text-xs font-semibold text-ink truncate max-w-[120px]">{fullName}</p>
          <p className="text-[10px] text-muted truncate max-w-[130px]">{email}</p>
        </div>
      </Link>

      {showSearch && <GlobalSearchDialog onClose={() => setShowSearch(false)} />}
    </div>
  );
}
