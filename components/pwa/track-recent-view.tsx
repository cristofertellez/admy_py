"use client";

import { useEffect } from "react";
import { pushRecentItem } from "@/lib/recent";

interface TrackRecentViewProps {
  type: "project" | "task";
  id: string;
  title: string;
}

/** Historia 14.6 — records the visit in the local recently-viewed list. */
export function TrackRecentView({ type, id, title }: TrackRecentViewProps) {
  useEffect(() => {
    pushRecentItem({ type, id, title });
  }, [type, id, title]);

  return null;
}
