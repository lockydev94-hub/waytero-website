import type { Metadata } from "next";
import HomepageServer from "@/components/renderers/HomepageServer";
import JsonLd, {
  itemList,
  webPageSchema,
} from "@/components/sections/JsonLd";
import { resolveSeo, toMetadata } from "@/services/seoService";

// ── Page-level SEO (SSR) — DB-driven with static fallback ────────────────────
export async function generateMetadata(): Promise<Metadata> {
  const seo = await resolveSeo("home");
  return toMetadata(seo, "/");
}

// Server-rendered for SEO — CMS payload fetched server-side with a
// 60s revalidate window; falls back to bundled defaults if the CMS is down.
export const revalidate = 60;

function HomeJsonLd() {
  return (
    <>
      <JsonLd
        data={webPageSchema({
          name: "WayTero — cabs, hotels and tour packages",
          description:
            "Book cabs, hotels and curated tour packages across the cities WayTero serves, with upfront pricing and verified partners.",
          path: "/",
        })}
      />
      <JsonLd
        data={itemList("WayTero travel services", [
          { name: "Cab booking", path: "/cabs" },
          { name: "Hotel booking", path: "/hotels" },
          { name: "Tour packages", path: "/tours" },
        ])}
      />
    </>
  );
}

export default function HomePage() {
  return (
    <>
      <HomeJsonLd />
      <HomepageServer />
    </>
  );
}