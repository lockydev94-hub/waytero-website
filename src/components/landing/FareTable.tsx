import { Container, Section, SectionHeader, MotionFadeIn } from "@/components/ui";
import { INR, enumLabel } from "./format";
import type { LandingFareRow } from "@/lib/landingIndex";

// ============================================================
// FareTable — the cab fare matrix, priced by the real fare engine.
//
// Responsive contract:
//  <640      stacked cards (name+seats, "Base ₹x · ₹y/km · incl. z km",
//            right-aligned sample total)
//  640-1023  real <table>, 4 of 6 columns
//  ≥1024     all 6 columns
//
// Every row carries a `source`; a city without its own rule honestly
// says "platform-standard pricing applies here" rather than implying
// a city-specific rate that doesn't exist.
// ============================================================

export default function FareTable({
  rows,
  title,
  gst,
  sampleDistanceKm,
}: {
  rows: LandingFareRow[];
  title?: string | null;
  gst: { enabled: boolean; rate_pct: number };
  sampleDistanceKm: number;
}) {
  if (!rows.length) return null;
  const anyDefault = rows.some((r) => r.source === "default");

  return (
    <Section bg="white" pad="md">
      <Container size="xl">
        <SectionHeader
          eyebrow="Transparent pricing"
          title={title ?? "Cab fares in this city"}
          subtitle={`Sample total is a ${sampleDistanceKm} km ride. ${
            gst.enabled
              ? `GST of ${gst.rate_pct}% is added at checkout.`
              : "Prices exclude GST."
          }`}
        />

        {/* Mobile — stacked cards */}
        <div className="mt-6 grid gap-3 sm:hidden">
          {rows.map((r, i) => (
            <div
              key={i}
              className="rounded-2xl border border-ink-7 bg-white p-4 shadow-wt-sm"
            >
              <div className="flex items-baseline justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-ink">
                    {enumLabel(r.vehicle_category)}
                    {r.source === "default" ? "*" : ""}
                    {r.seats ? (
                      <span className="ml-1.5 font-medium text-ink-4">
                        · {r.seats} seats
                      </span>
                    ) : null}
                  </div>
                  <div className="text-xs text-ink-4">{enumLabel(r.trip_type)}</div>
                </div>
                <div className="text-right">
                  <div className="text-base font-extrabold text-primary-600">
                    {INR(r.estimated_total)}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-ink-4">
                    {sampleDistanceKm} km sample
                  </div>
                </div>
              </div>
              <div className="mt-2 text-xs text-ink-4">
                Base {INR(r.base_fare)} · {INR(r.per_km_rate)}/km · incl.{" "}
                {r.minimum_km} km
              </div>
            </div>
          ))}
        </div>

        {/* sm+ — real table */}
        <MotionFadeIn className="mt-6 hidden overflow-hidden rounded-2xl border border-ink-7 sm:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink-1 text-xs uppercase tracking-wide text-ink-4">
              <tr>
                <th className="px-4 py-3 font-bold">Vehicle</th>
                <th className="px-4 py-3 font-bold">Trip type</th>
                <th className="hidden px-4 py-3 font-bold lg:table-cell">Base fare</th>
                <th className="hidden px-4 py-3 font-bold lg:table-cell">Per km</th>
                <th className="px-4 py-3 font-bold">Incl. km</th>
                <th className="px-4 py-3 text-right font-bold">
                  {sampleDistanceKm} km sample
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={i}
                  className="border-t border-ink-7 transition-colors hover:bg-primary-1/50"
                >
                  <td className="px-4 py-3">
                    <div className="font-bold text-ink">
                      {enumLabel(r.vehicle_category)}
                      {r.source === "default" ? "*" : ""}
                    </div>
                    {r.seats ? (
                      <div className="text-xs text-ink-4">{r.seats} seats</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-ink-3">{enumLabel(r.trip_type)}</td>
                  <td className="hidden px-4 py-3 text-ink-3 lg:table-cell">
                    {INR(r.base_fare)}
                  </td>
                  <td className="hidden px-4 py-3 text-ink-3 lg:table-cell">
                    {INR(r.per_km_rate)}
                  </td>
                  <td className="px-4 py-3 text-ink-3">{r.minimum_km}</td>
                  <td className="px-4 py-3 text-right font-extrabold text-primary-600">
                    {INR(r.estimated_total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </MotionFadeIn>

        {anyDefault && (
          <p className="mt-3 text-xs text-ink-4">
            Rows marked with an asterisk (*) follow WayTero&rsquo;s
            platform-standard pricing — this city has no custom rule yet.
          </p>
        )}
      </Container>
    </Section>
  );
}
