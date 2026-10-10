"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { canAccessRoute } from "@/lib/routes";
import { logout } from "@/actions/auth";

interface DashboardSidebarProps {
  role?: string;
  userId?: string;
  pendingTasksCount?: number;
}

export function DashboardSidebar({ role, pendingTasksCount = 12 }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Listen to mobile toggle event from header if triggered
  useEffect(() => {
    const handleToggle = () => setOpen((prev) => !prev);
    window.addEventListener("toggle-dashboard-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-dashboard-sidebar", handleToggle);
  }, []);

  return (
    <>
      {/* MOBILE TRIGGER BUTTON (Visible only on mobile header) */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="mr-2 flex h-9 w-9 items-center justify-center rounded-full border border-hairline/80 bg-surface-card transition-colors hover:bg-surface-card-elevated lg:hidden"
        aria-label="Toggle navigation menu"
      >
        {open ? (
          <svg className="h-5 w-5 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-5 w-5 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* MOBILE BACKDROP OVERLAY */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* SIDEBAR ASIDE */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-hairline/80 bg-canvas/95 backdrop-blur-md transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* BRAND LOGO HEADER */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-hairline/60 px-6">
          <Link href="/dashboard" className="group flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 transition-transform group-hover:scale-105">
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M9 12a3 3 0 1 0 6 0 3 3 0 1 0-6 0" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-ink transition-colors group-hover:text-emerald-400">
              Donezo
            </span>
          </Link>

          {/* Close button inside mobile drawer */}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:text-ink lg:hidden"
            aria-label="Close menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* NAVIGATION LINKS CONTAINER */}
        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-6 scrollbar-thin">
          {/* 1. MENU SECTION */}
          <div>
            <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-muted/60">
              MENU
            </div>
            <div className="space-y-1">
              {/* Dashboard */}
              <DonezoNavItem
                href="/dashboard"
                pathname={pathname}
                exact
                icon={<DonezoGridIcon active={pathname === "/dashboard"} />}
              >
                Dashboard
              </DonezoNavItem>

              {/* Tasks with Badge */}
              <DonezoNavItem
                href="/dashboard/tasks"
                pathname={pathname}
                icon={<DonezoTasksIcon />}
                badge={`${pendingTasksCount}+`}
              >
                Tasks
              </DonezoNavItem>

              {/* Calendar */}
              <DonezoNavItem
                href="/dashboard/tasks?view=calendar"
                pathname={pathname}
                icon={<DonezoCalendarIcon />}
              >
                Calendar
              </DonezoNavItem>

              {/* Analytics */}
              <DonezoNavItem
                href="/dashboard/reports"
                pathname={pathname}
                icon={<DonezoAnalyticsIcon />}
              >
                Analytics
              </DonezoNavItem>

              {/* Team */}
              <DonezoNavItem
                href="/dashboard/users"
                pathname={pathname}
                icon={<DonezoTeamIcon />}
              >
                Team
              </DonezoNavItem>

              {/* Projects */}
              <DonezoNavItem
                href="/dashboard/projects"
                pathname={pathname}
                icon={<DonezoFolderIcon />}
              >
                Projects
              </DonezoNavItem>

              {/* Clients */}
              <DonezoNavItem
                href="/dashboard/clients"
                pathname={pathname}
                icon={<DonezoClientsIcon />}
              >
                Clients
              </DonezoNavItem>

              {/* Files */}
              <DonezoNavItem
                href="/dashboard/files"
                pathname={pathname}
                icon={<DonezoFilesIcon />}
              >
                Files
              </DonezoNavItem>
            </div>
          </div>

          {/* 2. GENERAL SECTION */}
          <div>
            <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-muted/60">
              GENERAL
            </div>
            <div className="space-y-1">
              <DonezoNavItem
                href="/dashboard/settings"
                pathname={pathname}
                icon={<DonezoSettingsIcon />}
              >
                Settings
              </DonezoNavItem>

              <DonezoNavItem
                href="/dashboard/activity"
                pathname={pathname}
                icon={<DonezoHelpIcon />}
              >
                Help
              </DonezoNavItem>

              {/* Logout button */}
              <form action={logout}>
                <button
                  type="submit"
                  className="group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-all duration-150 hover:bg-surface-card hover:text-rose-400"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center text-muted transition-colors group-hover:text-rose-400">
                    <DonezoLogoutIcon />
                  </span>
                  <span className="truncate">Logout</span>
                </button>
              </form>
            </div>
          </div>

          {/* 3. ADMIN SECTION (Role-based) */}
          {(canAccessRoute("/dashboard/admin", role) ||
            canAccessRoute("/dashboard/roles", role) ||
            canAccessRoute("/dashboard/integrations", role) ||
            canAccessRoute("/dashboard/import", role)) && (
            <div>
              <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-muted/60">
                ADMIN
              </div>
              <div className="space-y-1">
                {canAccessRoute("/dashboard/admin", role) && (
                  <DonezoNavItem
                    href="/dashboard/admin"
                    pathname={pathname}
                    icon={<DonezoShieldIcon />}
                  >
                    Admin Panel
                  </DonezoNavItem>
                )}
                {canAccessRoute("/dashboard/roles", role) && (
                  <DonezoNavItem
                    href="/dashboard/roles"
                    pathname={pathname}
                    icon={<DonezoKeyIcon />}
                  >
                    Roles
                  </DonezoNavItem>
                )}
                {canAccessRoute("/dashboard/integrations", role) && (
                  <DonezoNavItem
                    href="/dashboard/integrations"
                    pathname={pathname}
                    icon={<DonezoPlugIcon />}
                  >
                    Integrations
                  </DonezoNavItem>
                )}
                {canAccessRoute("/dashboard/import", role) && (
                  <DonezoNavItem
                    href="/dashboard/import"
                    pathname={pathname}
                    icon={<DonezoImportIcon />}
                  >
                    Import Data
                  </DonezoNavItem>
                )}
              </div>
            </div>
          )}

          {/* 4. BOTTOM MOBILE APP / PWA DOWNLOAD CARD */}
          <div className="pt-2">
            <div className="relative overflow-hidden rounded-2xl border border-emerald-900/40 bg-[#071910] p-4 text-white shadow-md">
              {/* Organic topographic wavy lines */}
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full opacity-25"
                viewBox="0 0 200 130"
                fill="none"
              >
                <path d="M0 35 C 50 10, 110 65, 200 20" stroke="#34d399" strokeWidth="2" />
                <path d="M0 65 C 70 35, 130 95, 200 45" stroke="#34d399" strokeWidth="2" />
                <path d="M0 95 C 60 65, 140 120, 200 75" stroke="#34d399" strokeWidth="2" />
              </svg>

              <div className="relative z-10">
                <div className="mb-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                    <line x1="12" y1="18" x2="12.01" y2="18" />
                  </svg>
                </div>
                <h4 className="text-xs font-bold text-white">Download our Mobile App</h4>
                <p className="mt-0.5 text-[11px] text-emerald-200/70">Get easy in another way</p>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(new Event("pwa-install"));
                    }
                  }}
                  className="mt-3 block w-full rounded-full bg-[#134e35] py-1.5 text-center text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#1a6243]"
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}

/* --- NAV ITEM COMPONENT --- */

function DonezoNavItem({
  href,
  pathname,
  exact = false,
  icon,
  badge,
  children,
}: {
  href: string;
  pathname: string;
  exact?: boolean;
  icon: React.ReactNode;
  badge?: string;
  children: React.ReactNode;
}) {
  const isActive = exact
    ? pathname === href
    : pathname === href || (href !== "/dashboard" && pathname.startsWith(href.split("?")[0]));

  return (
    <Link
      href={href}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
        isActive
          ? "bg-surface-card/70 font-semibold text-ink shadow-xs"
          : "text-muted hover:bg-surface-card hover:text-ink"
      }`}
    >
      {/* Active Indicator Bar on Far Left */}
      {isActive && (
        <span className="absolute -left-4 top-1/2 -translate-y-1/2 h-6 w-1.5 rounded-r-full bg-emerald-500" />
      )}

      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center transition-colors ${
          isActive ? "text-emerald-400" : "text-muted group-hover:text-ink"
        }`}
      >
        {icon}
      </span>

      <span className="truncate">{children}</span>

      {/* Optional Badge */}
      {badge && (
        <span className="ml-auto inline-flex items-center justify-center rounded-full border border-emerald-800/40 bg-[#112d20] px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
          {badge}
        </span>
      )}
    </Link>
  );
}

/* --- DONEZO MINIMALIST ICONS --- */

function DonezoGridIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <rect
        x="3"
        y="3"
        width="7"
        height="7"
        rx="2"
        className={active ? "fill-emerald-500 stroke-emerald-500" : "stroke-current stroke-2"}
      />
      <rect x="14" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function DonezoTasksIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="m9 14 2 2 4-4" />
    </svg>
  );
}

function DonezoCalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function DonezoAnalyticsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function DonezoTeamIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function DonezoFolderIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function DonezoClientsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect width="20" height="14" x="2" y="7" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

function DonezoFilesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function DonezoSettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function DonezoHelpIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <line x1="4.93" y1="4.93" x2="9.17" y2="9.17" />
      <line x1="14.83" y1="14.83" x2="19.07" y2="19.07" />
      <line x1="14.83" y1="9.17" x2="19.07" y2="4.93" />
      <line x1="4.93" y1="19.07" x2="9.17" y2="14.83" />
    </svg>
  );
}

function DonezoLogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function DonezoShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </svg>
  );
}

function DonezoKeyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="m21 2-9.6 9.6" />
      <path d="m15.5 7.5 3 3L22 7l-3-3" />
    </svg>
  );
}

function DonezoPlugIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function DonezoImportIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
