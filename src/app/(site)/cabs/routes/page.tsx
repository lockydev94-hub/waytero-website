import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Car, Navigation, Route as RouteIcon,
} from "lucide-react";
import { Container, Section, MotionGlow } from "@/components/ui";
import { MotionStagger, MotionStaggerItem } from "@/components/ui";
import { resolveSeo, toMetadata } from "@/services/seoService";
import { getAvailability, serviceVisible } from "@/lib/availability";
import { API_BASE } from "@/lib/apiBase";
import JsonLd, {
  breadcrumbList,
  itemList,
  serviceSchema,
  webPageSchema,
} from "@/components/sections/JsonLd";

/* ============================================================
   /cabs/routes — the inter-city corridors hub.

   Reads GET /public/routes and lists EVERY published corridor on one page:
   the list is small (admin-authored), so a single crawlable page beats a
   paginated set that hides routes behind ?page= links.

   NOTE: this page must not read `searchParams`. Awaiting them makes the
   route dynamic and React then streams <title>/<meta>/canonical into the
   BODY, where they are not document metadata — which is why this page used
   to serve no head tags at all. The old GET search form and ?page links are
   gone for the same reason; all routes are in the DOM, so browser find, and
   the route cards, are the way to navigate.
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

const PAGE_SIZE = 60;

async function loadAllRoutes(): Promise<RouteRow[] | null> {
  const rows: RouteRow[] = [];
  try {
    for (let offset = 0; offset < 300; offset += PAGE_SIZE) {
      const res = await fetch(
        `${API_BASE}/public/routes?limit=${PAGE_SIZE}&offset=${offset}`,
        { next: { revalidate: 300 } },
      );
      if (!res.ok) return rows.length ? rows : null;
      const data = (await res.json()) as { items?: RouteRow[] };
      const items = data.items ?? [];
      rows.push(...items);
      if (items.length < PAGE_SIZE) break;
    }
    return rows;
  } catch {
    return rows.length ? rows : null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const seo = await resolveSeo("CAB", {
    title: "Cab Routes from Bhubaneswar",
    description:
      "Every inter-city cab corridor WayTero runs from Bhubaneswar, with the road distance for each. Open a route to see live fares by vehicle type.",
    keywords: [
      "cab routes from Bhubaneswar",
      "Bhubaneswar to Puri cab",
      "Bhubaneswar outstation cab",
      "intercity cab Odisha",
    ],
  });
  return toMetadata(seo, "/cabs/routes");
}

export default async function RoutesHubPage() {
  // Same hard gate as every other cab surface: CAB hidden → the hub 404s.
  const av = await getAvailability();
  if (!serviceVisible(av, "CAB")) notFound();

  const items = await loadAllRoutes();

  return (
    <>
      <JsonLd
        data={webPageSchema({
          name: "Popular inter-city cab routes from Bhubaneswar",
          description:
            "Every inter-city cab corridor WayTero runs from Bhubaneswar, with road distance and live fares by vehicle type.",
          path: "/cabs/routes",
          type: "CollectionPage",
        })}
      />
      <JsonLd
        data={serviceSchema({
          name: "Inter-city cab routes from Bhubaneswar",
          description:
            "Published inter-city cab corridors from Bhubaneswar with distance and live fares by vehicle type.",
          path: "/cabs/routes",
          areaName: "Bhubaneswar",
          areaType: "City",
          serviceType: "Inter-city taxi",
        })}
      />
      <JsonLd
        data={breadcrumbList([
          { name: "Home", path: "/" },
          { name: "Cabs", path: "/cabs" },
          { name: "Routes", path: "/cabs/routes" },
        ])}
      />
      {items && items.length > 0 && (
        <JsonLd
          data={itemList(
            "Popular cab routes",
            items.map((r) => ({
              name: `${r.origin_label} to ${r.destination_label}`,
              path: `/cabs/routes/${r.slug}`,
            })),
          )}
        />
      )}
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
              Cab routes from Bhubaneswar
            </h1>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-3">
              Every corridor we run, with the road distance for each. Open a route to see the
              live fare for every vehicle type — the same numbers the booking flow quotes.
            </p>
          </div>
        </Container>
      </Section>

      <Section bg="muted" pad="md" id="routes-list">
        <Container size="lg">
          {items === null ? (
            <div className="rounded-2xl border border-dashed border-ink-6 bg-white p-10 text-center">
              <p className="text-sm font-bold text-ink">Routes are unavailable right now</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-ink-3">
                We could not reach the route list. Please retry in a moment — the corridors and
                their fares are unchanged.
              </p>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink-6 bg-white p-10 text-center">
              <p className="text-sm font-bold text-ink">No routes published yet</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-ink-3">
                We publish a corridor once its fares are set. In the meantime, tell us where you
                need to go and support will quote it.
              </p>
              <Link
                href="/cabs"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary-600 px-5 py-2.5 text-sm font-bold text-white shadow-wt-primary transition-all hover:-translate-y-0.5 hover:bg-primary-700"
              >
                Book a cab <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <MotionStagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((r) => (
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
          )}
        </Container>
      </Section>
    </>
  );
}
