import { Users, Luggage } from "lucide-react";
import { Container, Section, SectionHeader, MotionStagger, MotionStaggerItem } from "@/components/ui";
import { API_BASE } from "@/lib/apiBase";
import type { CabCityRow } from "@/lib/cabCity";

/* ============================================================
   CabVehicleFares — "what does a ride actually cost" band.

   Every number is the fare engine's own output for one sample distance,
   read through GET /public/cab/cities/{id}/fare-matrix — the same rule
   resolution the booking flow uses. Nothing here is estimated by the
   frontend, so the band disappears entirely when a city has no rules
   rather than falling back to a made-up price.
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

// LOCAL reads best against the 10 km the band samples; the rest are the
// fallbacks in case a city only prices inter-city trip types.
const TRIP_PREFERENCE = ["LOCAL", "ONE_WAY", "AIRPORT", "OUTSTATION", "ROUND_TRIP"];

const TRIP_LABEL: Record<string, string> = {
  LOCAL: "local ride",
  ONE_WAY: "one-way trip",
  AIRPORT: "airport transfer",
  OUTSTATION: "outstation trip",
  ROUND_TRIP: "round trip",
};

const INR = (n: number | string) =>
  `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export default async function CabVehicleFares({
  city,
}: {
  city: CabCityRow | null;
}) {
  if (!city || city.pricing_source === "none") return null;

  let data: FareMatrix | null = null;
  try {
    const res = await fetch(
      `${API_BASE}/public/cab/cities/${city.id}/fare-matrix?distance_km=10`,
      { next: { revalidate: 300 } },
    );
    if (res.ok) data = (await res.json()) as FareMatrix;
  } catch {
    data = null;
  }

  const matrix = data;
  if (!matrix || matrix.pricing_source === "none" || !matrix.rows?.length) return null;

  const tripType =
    TRIP_PREFERENCE.find((code) => matrix.trip_types?.includes(code)) ??
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
    <Section bg="white" pad="tight">
      <Container size="xl">
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
              <div className="flex h-full flex-col rounded-2xl border border-ink-7 bg-white p-5 shadow-wt-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-wt-lg">
                <h3 className="text-base font-bold text-ink">{r.vehicle_category}</h3>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-4">
                  {r.seats != null && (
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" aria-hidden />
                      {r.seats} seats
                    </span>
                  )}
                  {r.luggage != null && (
                    <span className="inline-flex items-center gap-1.5">
                      <Luggage className="h-3.5 w-3.5" aria-hidden />
                      {r.luggage} bags
                    </span>
                  )}
                </div>
                <p className="mt-4 text-2xl font-extrabold tracking-tight text-primary-600">
                  {INR(r.estimated_total as number | string)}
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
