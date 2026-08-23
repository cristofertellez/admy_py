"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { canAccessRoute } from "@/lib/routes";

interface DashboardSidebarProps {
  role?: string;
}

export function DashboardSidebar({ role }: DashboardSidebarProps) {
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

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="mr-2 flex h-8 w-8 items-center justify-center rounded-md hover:bg-surface-card lg:hidden"
        aria-label="Toggle menu"
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

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] w-64 flex-col border-r border-hairline bg-canvas transition-transform duration-200 lg:flex lg:translate-x-0 ${
          open ? "flex translate-x-0" : "hidden -translate-x-full lg:hidden"
        }`}
      >
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-1">
            <NavItem href="/dashboard" pathname={pathname}>
              Overview
            </NavItem>
            <NavItem href="/dashboard/clients" pathname={pathname}>
              Clients
            </NavItem>
            <NavItem href="/dashboard/projects" pathname={pathname}>
              Projects
            </NavItem>
            <NavItem href="/dashboard/tasks" pathname={pathname}>
              Tasks
            </NavItem>
            <NavItem href="/dashboard/intermediaries" pathname={pathname}>
              Intermediaries
            </NavItem>
            <NavItem href="/dashboard/files" pathname={pathname}>
              Files
            </NavItem>
            <NavItem href="/dashboard/search" pathname={pathname}>
              Search
            </NavItem>
            <div className="my-2 border-t border-hairline" />
            <NavItem href="/dashboard/reports" pathname={pathname}>
              Reports
            </NavItem>
            <NavItem href="/dashboard/notifications" pathname={pathname}>
              Notifications
            </NavItem>
            {canAccessRoute("/dashboard/admin", role) && (
              <NavItem href="/dashboard/admin" pathname={pathname}>
                Admin Dashboard
              </NavItem>
            )}
            {canAccessRoute("/dashboard/users", role) && (
              <NavItem href="/dashboard/users" pathname={pathname}>
                Users
              </NavItem>
            )}
            {canAccessRoute("/dashboard/roles", role) && (
              <NavItem href="/dashboard/roles" pathname={pathname}>
                Roles
              </NavItem>
            )}
            {canAccessRoute("/dashboard/activity", role) && (
              <NavItem href="/dashboard/activity" pathname={pathname}>
                Activity
              </NavItem>
            )}
            <NavItem href="/dashboard/tags" pathname={pathname}>
              Tags
            </NavItem>
            {canAccessRoute("/dashboard/settings", role) && (
              <NavItem href="/dashboard/settings" pathname={pathname}>
                Settings
              </NavItem>
            )}
            <div className="my-2 border-t border-hairline" />
            <NavItem href="/dashboard/profile" pathname={pathname}>
              Profile
            </NavItem>
          </div>
        </nav>
      </aside>
    </>
  );
}

function NavItem({ href, pathname, children }: { href: string; pathname: string; children: React.ReactNode }) {
  const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={`rounded-md px-3 py-2 text-body-sm transition-colors ${
        isActive
          ? "bg-surface-card text-body-strong font-medium"
          : "text-muted hover:bg-surface-card hover:text-body-strong"
      }`}
    >
      {children}
    </Link>
  );
}
