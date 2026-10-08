// Historia 14.6 — locally stored "recently viewed" entities. Pure client
// utility: preferences and dashboard configuration live in the database,
// while this lightweight history enables quick offline navigation to the
// pages the Service Worker has already cached.

interface RecentItem {
  type: "project" | "task";
  id: string;
  title: string;
  at: string;
}

const STORAGE_KEY = "pwa-recent-v1";
const MAX_ITEMS = 10;

function safeParse(raw: string | null): RecentItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is RecentItem =>
        item !== null &&
        typeof item === "object" &&
        (item as RecentItem).type !== undefined &&
        typeof (item as RecentItem).id === "string" &&
        typeof (item as RecentItem).title === "string",
    );
  } catch {
    return [];
  }
}

export function listRecentItems(): RecentItem[] {
  if (typeof window === "undefined") return [];
  return safeParse(window.localStorage.getItem(STORAGE_KEY));
}

export function pushRecentItem(item: Omit<RecentItem, "at">): void {
  if (typeof window === "undefined") return;
  const existing = listRecentItems().filter(
    (candidate) => !(candidate.type === item.type && candidate.id === item.id),
  );
  const next: RecentItem[] = [{ ...item, at: new Date().toISOString() }, ...existing].slice(0, MAX_ITEMS);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage may be unavailable (private mode); recents are best-effort.
  }
}

export function getRecentHref(item: RecentItem): string {
  return item.type === "project"
    ? `/dashboard/projects/${item.id}`
    : `/dashboard/tasks/${item.id}`;
}
