import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined, fallback = "—"): string {
  if (!date) return fallback;
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toLocaleDateString();
}

export function formatDateTime(date: string | Date | null | undefined, fallback = "—"): string {
  if (!date) return fallback;
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? fallback
    : parsed.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}
