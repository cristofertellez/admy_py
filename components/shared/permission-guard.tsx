"use client";

import { type ReactNode } from "react";

const PERMISSION_HIERARCHY: Record<string, string[]> = {
  Developer: [
    "projects.*",
    "clients.*",
    "tasks.*",
    "comments.*",
    "files.*",
    "reports.*",
    "settings.*",
    "intermediaries.*",
  ],
  Client: [
    "projects.read",
    "tasks.read",
    "comments.create",
    "comments.read",
    "files.download",
  ],
  Intermediary: [
    "projects.read",
    "clients.read",
    "tasks.read",
    "comments.create",
    "comments.read",
    "files.download",
    "reports.view",
  ],
};

function checkPermission(roleName: string, permission: string): boolean {
  const allowed = PERMISSION_HIERARCHY[roleName] || [];
  return allowed.some((p) => {
    if (p.endsWith(".*")) {
      const module = p.replace(".*", "");
      return permission.startsWith(module);
    }
    return p === permission;
  });
}

function hasPermission(roleName: string | null | undefined, permission: string): boolean {
  if (!roleName) return false;
  return checkPermission(roleName, permission);
}

export function canPerform(roleName: string | null | undefined, permission: string): boolean {
  return hasPermission(roleName, permission);
}

interface PermissionGuardProps {
  permission: string;
  roleName: string | null | undefined;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuard({
  permission,
  roleName,
  children,
  fallback = null,
}: PermissionGuardProps) {
  if (!hasPermission(roleName, permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
