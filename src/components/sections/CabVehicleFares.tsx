import Link from "next/link";
import { Users, Info } from "lucide-react";
import { Container, Section, SectionHeader, MotionStagger, MotionStaggerItem } from "@/components/ui";
import { API_BASE } from "@/lib/apiBase";
import { fetchCabPriceList, inr, standardPackage, type CabPriceClass } from "@/lib/cabPrices";
import type { CabCityRow } from "@/lib/cabCity";

/* ============================================================
   CabVehicleFares — "what does a ride actually cost" band.

   The booking flow prices a local ride from the city's rate card (8h/80km,
   5h/50km, …) whenever the city has one, so this band shows those package
   prices too. It used to show a per-km 10 km total, which was a price no
   search would ever charge — ₹210 on the homepage against ₹2,200 at checkout.

   The per-km fare matrix remains as the fallback for a city with no card at
   all, where the booking flow really does quote base + per-km. Nothing here is
   estimated by the frontend, so the band disappears rather than inventing a
   number.
   ============================================================ */

interface FareRow {
  vehicle_category: string;
  seats: number | null;
  luggage: number | null;
  trip_type: string;
  estimated_total: number | string | null;
  sample_distance_km: number | string;
  source: string;
}

interface FareMatrix {
  city_name: string;
  distance_km: number | string;
  pricing_source: "city_specific" | "default" | "none";
  trip_types: string[];
  rows: FareRow[];
}

const MAX_CARDS = 4;

const TRIP_PREFERENCE = ["LOCAL", "ONE_WAY", "AIRPORT", "OUTSTATION", "ROUND_TRIP"];

const TRIP_LABEL: Record<string, string> = {
  LOCAL: "local ride",
  ONE_WAY: "one-way trip",
  AIRPORT: "airport transfer",
  OUTSTATION: "outstation trip",
  ROUND_TRIP: "round trip",
};

function cardRows(classes: CabPriceClass[]): CabPriceClass[] {
  return classes
    .filter((c) => c.packages.some((p) => p.rental_type === "LOCAL"))
    .sort((a, b) => {
      const pa = Number(standardPackage(a.packages.filter((p) => p.rental_type === "LOCAL")).price);
      const pb = Number(standardPackage(b.packages.filter((p) => p.rental_type === "LOCAL")).price);
      return pa - pb;
    })
    .slice(0, MAX_CARDS);
}

export default async function CabVehicleFares({
  city,
}: {
  city: CabCityRow | null;
}) {
  if (!city || city.pricing_source === "none") return null;

  const priceList = await fetchCabPriceList(city.id);
  const classes = priceList ? cardRows(priceList.classes) : [];

  if (classes.length > 0) {
    return (
      <Section bg="white" pad="home">
        <Container size="wide">
          <SectionHeader
            eyebrow="Real fares"
            title={`Cab types and what they cost in ${priceList?.city_name ?? city.name}`}
            subtitle="Local hire is sold as a package: a set number of hours and kilometres at a fixed price. Your exact total — package, extra distance and taxes — is itemised before you pay."
            accent="primary"
            underline
            scale="home"
          />
          <MotionStagger className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {classes.map((cls) => {
              const pkg = standardPackage(
                cls.packages.filter((p) => p.rental_type === "LOCAL"),
              );
              return (
                <MotionStaggerItem key={cls.vehicle_class}>
                  <div className="flex h-full flex-col rounded-2xl bg-white p-5 shadow-[0_10px_30px_-22px_rgba(16,24,40,0.45)] ring-1 ring-black/[0.05] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-wt-lg">
                    <h3 className="text-base font-bold text-ink">{cls.vehicle_label}</h3>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-4">
                      {cls.seating_capacity != null && (
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" aria-hidden />
                          {cls.seating_capacity} seats
                        </span>
                      )}
                    </div>
                    <p className="mt-4 text-2xl font-extrabold tracking-tight text-primary-600">
                      {inr(pkg.price)}
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-ink-4">
                      {pkg.included_hours}h / {pkg.included_km} km local package ·{" "}
                      {inr(pkg.extra_km_rate)}/extra km
                      {cls.rate_source === "PLATFORM" ? " · standard card" : ""}
                    </p>
                  </div>
                </MotionStaggerItem>
              );
            })}
          </MotionStagger>
          <p className="mt-4 flex items-start gap-2 text-[11.5px] leading-relaxed text-ink-4">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Prices are per vehicle, pre-tax. The driver allowance is inside the
              package price; tolls and parking are billed as they occur.{" "}
              <Link href="/cabs/prices" className="font-bold text-primary-700 hover:underline">
                See the full price list
              </Link>
              .
            </span>
          </p>
        </Container>
      </Section>
    );
  }

  // ── Fallback: no rate card, so the booking flow quotes per-km ──
  let matrix: FareMatrix | null = null;
  try {
    const res = await fetch(
      `${API_BASE}/public/cab/cities/${city.id}/fare-matrix?distance_km=10`,
      { next: { revalidate: 300 } },
    );
    if (res.ok) matrix = (await res.json()) as FareMatrix;
  } catch {
    matrix = null;
  }
  if (!matrix || !matrix.rows?.length) return null;

  const tripType =
    TRIP_PREFERENCE.find((code) => matrix!.trip_types?.includes(code)) ??
    matrix.trip_types?.[0] ??
    "LOCAL";

  const seen = new Set<string>();
  const rows: FareRow[] = [];
  for (const r of matrix.rows) {
    if (r.trip_type !== tripType || r.estimated_total == null) continue;
    if (seen.has(r.vehicle_category)) continue;
    seen.add(r.vehicle_category);
    rows.push(r);
    if (rows.length === MAX_CARDS) break;
  }
  if (!rows.length) return null;

  const sampleKm = Number(matrix.distance_km ?? 10).toFixed(0);
  const tripLabel = TRIP_LABEL[tripType] ?? "ride";

  return (
    <Section bg="white" pad="home">
      <Container size="wide">
        <SectionHeader
          eyebrow="Real fares"
          title={`Cab types and what they cost in ${matrix.city_name}`}
          subtitle={`Every vehicle we price for a ${tripLabel}, at a sample ${sampleKm} km. The exact total — base fare, per-km, driver allowance and taxes — is itemised before you pay.`}
          accent="primary"
          underline
          scale="home"
        />
        <MotionStagger className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {rows.map((r) => (
            <MotionStaggerItem key={r.vehicle_category}>
              <div className="flex h-full flex-col rounded-2xl bg-white p-5 shadow-[0_10px_30px_-22px_rgba(16,24,40,0.45)] ring-1 ring-black/[0.05] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-wt-lg">
                <h3 className="text-base font-bold text-ink">{r.vehicle_category}</h3>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-4">
                  {r.seats != null && (
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" aria-hidden />
                      {r.seats} seats
                    </span>
                  )}
                </div>
                <p className="mt-4 text-2xl font-extrabold tracking-tight text-primary-600">
                  {inr(r.estimated_total as number | string)}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-ink-4">
                  sample {sampleKm} km {tripLabel} · taxes shown at checkout
                  {r.source === "default" ? " · platform-standard rates" : ""}
                </p>
              </div>
            </MotionStaggerItem>
          ))}
        </MotionStagger>
      </Container>
    </Section>
  );
}
