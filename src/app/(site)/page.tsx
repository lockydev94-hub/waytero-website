import type { Metadata } from "next";
import HomepageServer from "@/components/renderers/HomepageServer";
import { resolveSeo, toMetadata } from "@/services/seoService";

// ── Page-level SEO (SSR) — DB-driven with static fallback ────────────────────
export async function generateMetadata(): Promise<Metadata> {
  const seo = await resolveSeo("home");
  return toMetadata(seo, "/");
}

// Server-rendered for SEO — CMS payload fetched server-side with a
// 60s revalidate window; falls back to bundled defaults if the CMS is down.
export const revalidate = 60;

export default function HomePage() {
  return <HomepageServer />;
}