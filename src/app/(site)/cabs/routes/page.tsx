import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Car, Navigation, Route as RouteIcon, Search,
} from "lucide-react";
import { Container, Section, MotionGlow } from "@/components/ui";
import { MotionStagger, MotionStaggerItem } from "@/components/ui";
import { resolveSeo, toMetadata } from "@/services/seoService";
import { getAvailability, serviceVisible } from "@/lib/availability";
import { API_BASE } from "@/lib/apiBase";

/* ============================================================
   /cabs/routes — the inter-city corridors hub.

   Reads GET /public/routes (paginated, `q` searches both endpoints).
   The list endpoint deliberately carries no fare math: this page shows
   where we run and how far, and each route page quotes the live prices.
   ============================================================ */

interface RouteRow {
  id: number;
  slug: string;
  origin_label: string;
  destination_label: string;
  distance_km: number | string;
  distance_source: "GOOGLE" | "HAVERSINE" | "MANUAL";
  image_url: string | null;
  vehicle_count: number;
}

const LIMIT = 12;

async function loadRoutes(
  q: string,
  page: number,
): Promise<{ items: RouteRow[]; total: number } | null> {
  const params = new URLSearchParams({
    limit: String(LIMIT),
    offset: String((page - 1) * LIMIT),
  });
  if (q) params.set("q", q);
  try {
    const res = await fetch(`${API_BASE}/public/routes?${params.toString()}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { items: RouteRow[]; total: number };
    return { items: data.items ?? [], total: Number(data.total ?? 0) };
  } catch {
    return null;
  }
}

type SearchParams = Promise<{ q?: string; page?: string }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { page } = await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);
  const seo = await resolveSeo("CAB", {
    title: "Popular Cab Routes — Inter-city Fares",
    description:
      "Every inter-city cab corridor WayTero runs, with the road distance for each. Open a route to see live fares by vehicle type.",
    keywords: ["cab routes", "intercity cab", "outstation cab fares", "route distance"],
  });
  // Paginated pages keep the page-1 canonical (toMetadata builds it from the
  // path, which never carries `page`) so the set can't compete with itself.
  return toMetadata(
    {
      ...seo,
      title: pageNum > 1 ? `${seo.title} — Page ${pageNum}` : seo.title,
    },
    "/cabs/routes",
  );
}

export default async function RoutesHubPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // Same hard gate as every other cab surface: CAB hidden → the hub 404s.
  const av = await getAvailability();
  if (!serviceVisible(av, "CAB")) notFound();

  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 120);
  const page = Math.min(1000, Math.max(1, Number(sp.page) || 1));
  const data = await loadRoutes(q, page);

  const pages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;
  const href = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (p > 1) params.set("page", String(p));
    const tail = params.toString();
    return tail ? `/cabs/routes?${tail}` : "/cabs/routes";
  };

  return (
    <>
      <Section bg="white" pad="md" overlay="grid" id="routes-head">
        <Container size="lg">
          <Link
            href="/cabs"
            className="inline-flex items-center gap-1.5 text-[13px] font-bold text-ink-3 transition-colors hover:text-primary-600"
          >
            <ArrowLeft className="h-4 w-4" /> Back to cabs
          </Link>

          <div className="mt-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-600/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-700">
              <RouteIcon className="h-3.5 w-3.5" /> Inter-city cab
            </span>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink sm:text-[34px] sm:leading-tight">
              Popular cab routes
            </h1>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-3">
              Every corridor we run, with the road distance for each. Open a route to see the
              live fare for every vehicle type — the same numbers the booking flow quotes.
            </p>
          </div>

          {/* Server-rendered GET form: submitting it is just a navigation,
              so the search costs no client JavaScript. */}
          <form action="/cabs/routes" method="get" className="mt-7 flex max-w-xl flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-4" />
              <input
                type="search"
                name="q"
                defaultValue={q}
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
            {q && (
              <Link
                href="/cabs/routes"
                className="rounded-full border border-ink-7 px-4 py-2.5 text-sm font-bold text-ink-3 transition-colors hover:border-ink-5 hover:text-ink"
              >
                Clear
              </Link>
            )}
          </form>

          {q && data && (
            <p className="mt-4 text-sm text-ink-3">
              <span className="font-bold text-ink">
                {data.total} route{data.total === 1 ? "" : "s"}
              </span>{" "}
              matching “{q}”
            </p>
          )}
        </Container>
      </Section>

      <Section bg="muted" pad="md" id="routes-list">
        <Container size="lg">
          {data === null ? (
            <div className="rounded-2xl border border-dashed border-ink-6 bg-white p-10 text-center">
              <p className="text-sm font-bold text-ink">Routes are unavailable right now</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-ink-3">
                We could not reach the route list. Please retry in a moment — the corridors and
                their fares are unchanged.
              </p>
            </div>
          ) : data.items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink-6 bg-white p-10 text-center">
              <p className="text-sm font-bold text-ink">
                {q ? `No route matches “${q}”` : "No routes published yet"}
              </p>
              <p className="mx-auto mt-1 max-w-md text-sm text-ink-3">
                {q
                  ? "Try a city name — the search matches either end of a corridor."
                  : "We publish a corridor once its fares are set. In the meantime, tell us where you need to go and support will quote it."}
              </p>
              <Link
                href="/cabs"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary-600 px-5 py-2.5 text-sm font-bold text-white shadow-wt-primary transition-all hover:-translate-y-0.5 hover:bg-primary-700"
              >
                Book a cab <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <>
              <MotionStagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.items.map((r) => (
                  <MotionStaggerItem key={r.id} className="h-full">
                    <MotionGlow color="primary" intensity={0.18} size={300} className="h-full rounded-2xl">
                      <Link
                        href={`/cabs/routes/${r.slug}`}
                        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink-7 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-primary-300 hover:shadow-wt-xl"
                      >
                        <div className="relative h-32 overflow-hidden bg-gradient-to-br from-primary-100 via-primary-50 to-accent-50">
                          {r.image_url ? (
                            <Image
                              src={r.image_url}
                              alt={`${r.origin_label} to ${r.destination_label}`}
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
                              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                            />
                          ) : (
                            <div className="absolute inset-0 grid place-items-center text-primary-300">
                              <Navigation className="h-8 w-8" />
                            </div>
                          )}
                          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-primary-700 shadow-wt-sm backdrop-blur">
                            {Number(r.distance_km).toFixed(0)} km
                            {r.distance_source === "HAVERSINE" ? " · est." : ""}
                          </span>
                        </div>

                        <div className="flex flex-1 flex-col p-4">
                          <h2 className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] font-extrabold leading-snug tracking-tight text-ink group-hover:text-primary-700">
                            {r.origin_label}
                            <Navigation className="h-4 w-4 shrink-0 text-primary-500" />
                            {r.destination_label}
                          </h2>
                          <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-ink-4">
                            <Car className="h-3.5 w-3.5" />
                            {r.vehicle_count > 0
                              ? `${r.vehicle_count} vehicle type${r.vehicle_count === 1 ? "" : "s"}`
                              : "Fares being set"}
                          </p>
                          <span className="mt-auto flex items-center justify-center gap-1.5 pt-4 text-[13px] font-bold text-primary-700">
                            See fares
                            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                          </span>
                        </div>
                      </Link>
                    </MotionGlow>
                  </MotionStaggerItem>
                ))}
              </MotionStagger>

              {pages > 1 && (
                <nav
                  aria-label="Route pages"
                  className="mt-9 flex flex-wrap items-center justify-center gap-2"
                >
                  {page > 1 && (
                    <Link
                      href={href(page - 1)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-ink-7 bg-white px-4 py-2 text-[13px] font-bold text-ink-3 transition-colors hover:border-primary-300 hover:text-primary-700"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Prev
                    </Link>
                  )}
                  <span className="rounded-full bg-ink-8 px-4 py-2 text-[13px] font-bold text-ink-2">
                    Page {page} of {pages}
                  </span>
                  {page < pages && (
                    <Link
                      href={href(page + 1)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-ink-7 bg-white px-4 py-2 text-[13px] font-bold text-ink-3 transition-colors hover:border-primary-300 hover:text-primary-700"
                    >
                      Next <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </nav>
              )}
            </>
          )}
        </Container>
      </Section>
    </>
  );
}
