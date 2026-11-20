import { Container, Section, SectionHeader, MotionFadeIn } from "@/components/ui";
import { INR, enumLabel } from "./format";
import type { LandingFareRow } from "@/lib/landingIndex";

// ============================================================
// FareTable — the cab fare matrix, priced from the city's rental
// rate card.
//
// A row is a package, not a per-km estimate: "Local · 8h/80km ·
// ₹2,200" is a price the booking flow charges, where a 10 km
// per-km sample used to quote a fare no search ever returned. That
// is also why every row keeps its `source`: a class priced by the
// platform card rather than the city's own sheet says so.
//
// Responsive contract:
//  <640      stacked cards (name+seats, package line, right-aligned price)
//  640-1023  real <table>, 4 of 5 columns
//  ≥1024     all 5 columns
// ============================================================

const RENTAL_LABEL: Record<string, string> = {
  LOCAL: "Local",
  OUTSTATION: "Outstation",
  DAILY: "Daily",
};

function packageLabel(r: LandingFareRow): string {
  const kind = RENTAL_LABEL[r.rental_type] ?? enumLabel(r.rental_type);
  const window = `${r.included_hours}h / ${r.included_km}km`;
  return r.rental_type === "DAILY" ? `${kind} · ${window} per day` : `${kind} · ${window}`;
}

export default function FareTable({
  rows,
  title,
  gst,
}: {
  rows: LandingFareRow[];
  title?: string | null;
  gst: { enabled: boolean; rate_pct: number };
}) {
  if (!rows.length) return null;
  const anyPlatform = rows.some((r) => r.source === "PLATFORM");

  return (
    <Section bg="white" pad="md">
      <Container size="xl">
        <SectionHeader
          eyebrow="Transparent pricing"
          title={title ?? "Cab fares in this city"}
          subtitle={`Fixed packages with the driver's hours and kilometres included. ${
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
                    {r.vehicle_label || enumLabel(r.vehicle_category)}
                    {r.source === "PLATFORM" ? "*" : ""}
                    {r.seats ? (
                      <span className="ml-1.5 font-medium text-ink-4">
                        · {r.seats} seats
                      </span>
                    ) : null}
                  </div>
                  <div className="text-xs text-ink-4">{packageLabel(r)}</div>
                </div>
                <div className="text-right">
                  <div className="text-base font-extrabold text-primary-600">
                    {INR(r.estimated_total)}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-ink-4">
                    per package
                  </div>
                </div>
              </div>
              <div className="mt-2 text-xs text-ink-4">
                {INR(r.extra_km_rate)}/km and {INR(r.extra_hour_rate)}/h beyond
                the package
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
                <th className="px-4 py-3 font-bold">Package</th>
                <th className="hidden px-4 py-3 font-bold lg:table-cell">
                  Extra km
                </th>
                <th className="hidden px-4 py-3 font-bold lg:table-cell">
                  Extra hour
                </th>
                <th className="px-4 py-3 text-right font-bold">Price</th>
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
                      {r.vehicle_label || enumLabel(r.vehicle_category)}
                      {r.source === "PLATFORM" ? "*" : ""}
                    </div>
                    {r.seats ? (
                      <div className="text-xs text-ink-4">{r.seats} seats</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-ink-3">{packageLabel(r)}</td>
                  <td className="hidden px-4 py-3 text-ink-3 lg:table-cell">
                    {INR(r.extra_km_rate)}/km
                  </td>
                  <td className="hidden px-4 py-3 text-ink-3 lg:table-cell">
                    {INR(r.extra_hour_rate)}/h
                  </td>
                  <td className="px-4 py-3 text-right font-extrabold text-primary-600">
                    {INR(r.estimated_total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </MotionFadeIn>

        {anyPlatform && (
          <p className="mt-3 text-xs text-ink-4">
            Rows marked with an asterisk (*) follow WayTero&rsquo;s
            platform-standard rate card — this city has no custom card for that
            vehicle yet.
          </p>
        )}
      </Container>
    </Section>
  );
}
