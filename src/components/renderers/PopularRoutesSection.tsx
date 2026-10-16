import Link from "next/link";
import { ArrowUpRight, Navigation, Search } from "lucide-react";
import { Container, Section, SectionHeader, MotionGlow } from "@/components/ui";
import { MotionStagger, MotionStaggerItem } from "@/components/ui";
import { pick } from "@/types/cms";
import { API_BASE } from "@/lib/apiBase";

/* ============================================================
   WayTero — homepage "Popular Routes" band

   Data source: GET /public/routes (migration 0079). The list carries
   endpoints and a distance only — no price is fetched here, so the band
   stays one cheap query and each route page quotes live fares instead.
   ============================================================ */

interface RouteItem {
  id: number;
  slug: string;
  origin_label: string;
  destination_label: string;
  distance_km: number | string;
  distance_source: "GOOGLE" | "HAVERSINE" | "MANUAL";
}

interface RoutesPage {
  items: RouteItem[];
  total: number;
}

const LIMIT = 12;

export default async function PopularRoutesSection({ variant }: { variant: Record<string, unknown> }) {
  const eyebrow = pick<string>(variant, "variant_tag", "Where people travel");
  const title = pick<string>(variant, "headline", "Popular Routes");
  const subtitle = pick<string>(
    variant,
    "subheadline",
    "Inter-city cab fares from our live fare engine.",
  );

  let routes: RouteItem[] = [];
  let total = 0;
  try {
    const res = await fetch(`${API_BASE}/public/routes?limit=${LIMIT}&offset=0`, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const data = (await res.json()) as RoutesPage;
      routes = data.items ?? [];
      total = Number(data.total ?? 0);
    }
  } catch {
    routes = [];
  }

  // No routes authored yet → omit the band (owner rule: nothing the
  // database can't back up).
  if (routes.length === 0) return null;

  return (
    <Section bg="white" pad="home" id="routes" overlay="grid-faint">
      <Container size="lg">
        <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} accent="primary" underline animatedEyebrow scale="home" />

        {/* Server-rendered GET form — a plain submit navigates to the hub,
            so this needs no client component. */}
        <form action="/cabs/routes" method="get" className="mx-auto mb-5 flex max-w-md items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-4" />
            <input
              type="search"
              name="q"
              placeholder="Search a route, e.g. Puri"
              className="w-full rounded-full border border-ink-7 bg-ink-9/60 py-2.5 pl-10 pr-4 text-sm text-ink outline-none transition-all placeholder:text-ink-5 focus:border-primary-400 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
            />
          </div>
          <button
            type="submit"
            className="rounded-full bg-primary-600 px-5 py-2.5 text-sm font-bold text-white shadow-wt-primary transition-all hover:-translate-y-0.5 hover:bg-primary-700"
          >
            Search
          </button>
        </form>

        <MotionStagger className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {routes.map((r) => (
            <MotionStaggerItem key={r.id}>
              <MotionGlow color="primary" intensity={0.18} size={260} className="rounded-2xl">
                <Link
                  href={`/cabs/routes/${r.slug}`}
                  className="group flex items-center gap-3 rounded-2xl border border-ink-7 bg-white px-4 py-3.5 transition-all duration-300 ease-[var(--ease-wt)] hover:-translate-y-0.5 hover:border-primary-300 hover:bg-primary-50/40 hover:shadow-wt-lg"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 text-white shadow-wt-sm transition-transform duration-300 group-hover:scale-110">
                    <Navigation className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 truncate text-[14px] font-bold text-ink group-hover:text-primary-700">
                      {r.origin_label}
                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-primary-500" />
                      {r.destination_label}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-ink-4">
                      {Number(r.distance_km).toFixed(0)} km
                      {r.distance_source === "HAVERSINE" ? " · estimated" : ""}
                    </span>
                  </span>
                </Link>
              </MotionGlow>
            </MotionStaggerItem>
          ))}
        </MotionStagger>

        <div className="mt-6 text-center">
          <Link
            href="/cabs/routes"
            className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white px-5 py-2.5 text-sm font-bold text-primary-700 transition-all hover:border-primary-400 hover:bg-primary-50 hover:shadow-wt"
          >
            {total > routes.length ? `View more (${routes.length} of ${total})` : "View all routes"}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </Container>
    </Section>
  );
}
