import type { ReactNode } from "react";
import { pageMetadata } from "@/services/seoService";

// Client page — cannot export metadata; <head> values live here,
// DB-first via SEO_PAGE_TRACK.
export async function generateMetadata() {
  return pageMetadata("track", "/track", {
    title: "Track Your Trip",
    description:
      "Follow your WayTero cab live — driver details, route, and ETA in real time.",
    keywords: ["live tracking", "track booking", "cab tracking", "WayTero"],
  });
}

export default function TrackLayout({ children }: { children: ReactNode }) {
  return children;
}
