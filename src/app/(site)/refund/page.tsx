import { Container, PageHeader, Card, Badge, MotionGlow } from "@/components/ui";
import { Section, MotionStagger, MotionStaggerItem } from "@/components/ui";
import { publicCmsService, LiveCancellationPolicy } from "@/services/publicCms";

export const metadata = { title: "Refund Policy", description: "WayTero's tiered refund policy for cab, hotel, and tour bookings." };

// Static fallback matching the engine defaults (BRD Part 3 §46, BRD Part 5 §119) —
// used only when the backend is unreachable. The live values from
// GET /public/cancellation-policy always win when available.
const FALLBACK: LiveCancellationPolicy = {
  cab: { free_hours: 2, tier_1_hours: 12, tier_1_percent: 75, tier_2_hours: 4, tier_2_percent: 50, same_day_percent: 0, after_assignment_percent: 50 },
  tour: { free_days: 30, tier_1_days: 15, tier_1_percent: 75, tier_2_days: 7, tier_2_percent: 50, tier_3_percent: 25, last_minute_percent: 0 },
  hotel: { note: "" },
};

function pct(v: number): string {
  return `${v}%`;
}

export default async function RefundPage() {
  const live = (await publicCmsService.getCancellationPolicy()) ?? FALLBACK;
  const cab = live.cab;
  const tour = live.tour;

  const CAB_TIERS = [
    { tier: `${cab.free_hours}+ hours before pickup`, charge: "Free", refund: "100% to wallet" },
    { tier: `${cab.tier_1_hours}–${cab.free_hours} hours before`, charge: `${100 - cab.tier_1_percent}% of fare`, refund: `${cab.tier_1_percent}% to wallet` },
    { tier: `${cab.tier_2_hours}–${cab.tier_1_hours} hours before`, charge: `${100 - cab.tier_2_percent}% of fare`, refund: `${cab.tier_2_percent}% to wallet` },
    { tier: `Less than ${cab.tier_2_hours} hours before`, charge: `${100 - cab.same_day_percent}% of fare`, refund: `${cab.same_day_percent}% to wallet` },
    { tier: "After driver assigned", charge: `${100 - cab.after_assignment_percent}% of fare`, refund: `${cab.after_assignment_percent}% to wallet` },
    { tier: "No-show / after pickup", charge: "100% of fare", refund: "No refund" },
  ];

  const TOUR_TIERS = [
    { tier: `${tour.free_days}+ days before travel`, charge: "Free", refund: `${tour.tier_1_percent}% to wallet` },
    { tier: `${tour.tier_1_days}–${tour.free_days} days before`, charge: `${100 - tour.tier_2_percent}% of fare`, refund: `${tour.tier_2_percent}% to wallet` },
    { tier: `${tour.tier_2_days}–${tour.tier_1_days} days before`, charge: `${100 - tour.tier_3_percent}% of fare`, refund: `${tour.tier_3_percent}% to wallet` },
    { tier: `Less than ${tour.tier_2_days} days before`, charge: `${100 - tour.last_minute_percent}% of fare`, refund: `${tour.last_minute_percent}% to wallet` },
  ];

  const HIGHLIGHTS = [
    { title: "Wallet-first", desc: "All refunds credit your WayTero Travel Wallet instantly.", glow: "primary" as const },
    { title: "Capped at advance", desc: "You are never out-of-pocket — the refund is capped at the advance you actually paid.", glow: "accent" as const },
    { title: "Self-service", desc: "Cancel anytime from your bookings page — the preview shows your refund before you commit.", glow: "success" as const },
  ];

  return (
    <>
      <Section bg="white" pad="lg" className="bg-gradient-to-br from-primary-50/40 via-white to-white">
        <Container size="lg">
          <PageHeader
            eyebrow="Policy"
            title={
              <>
                Refund &amp; <span className="text-gradient-primary">Cancellation</span> Policy
              </>
            }
            subtitle="WayTero uses a tiered, time-based refund engine. The closer to your pickup time, the higher the cancellation charge — but never more than the advance you paid."
          />
        </Container>
      </Section>

      <Section bg="grid" pad="md">
        <Container size="lg">
          <MotionStagger className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            {HIGHLIGHTS.map((h) => (
              <MotionStaggerItem key={h.title}>
                <Card variant="premium" padded className="h-full">
                  <div className="mb-2">
                    <Badge tone={h.glow}>{h.title}</Badge>
                  </div>
                  <p className="text-sm text-ink-3">{h.desc}</p>
                </Card>
              </MotionStaggerItem>
            ))}
          </MotionStagger>

          {/* ── Cab ladder ─────────────────────────────────── */}
          <MotionGlow className="mb-8">
            <Card variant="premium" padded={false} className="overflow-hidden">
              <div className="px-6 sm:px-8 py-5 border-b border-ink-8 bg-gradient-to-r from-primary-50/50 via-white to-white flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary-600 text-white inline-flex items-center justify-center text-lg font-black">C</div>
                <div>
                  <h2 className="font-extrabold text-lg text-ink">Cab bookings</h2>
                  <p className="text-xs text-ink-4">Time before pickup · live from the platform policy engine</p>
                </div>
              </div>
              <div className="divide-y divide-ink-8">
                {CAB_TIERS.map((t) => (
                  <div key={t.tier} className="flex items-center justify-between gap-4 px-6 sm:px-8 py-3.5 hover:bg-ink-9/40 transition-colors">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-ink">{t.tier}</div>
                      <div className="text-xs text-ink-4">Cancellation charge: {t.charge}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-xs font-bold">
                        {t.refund}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </MotionGlow>

          {/* ── Tour ladder ────────────────────────────────── */}
          <MotionGlow className="mb-8">
            <Card variant="premium" padded={false} className="overflow-hidden">
              <div className="px-6 sm:px-8 py-5 border-b border-ink-8 bg-gradient-to-r from-amber-50/60 via-white to-white flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white inline-flex items-center justify-center text-lg font-black">T</div>
                <div>
                  <h2 className="font-extrabold text-lg text-ink">Tour packages</h2>
                  <p className="text-xs text-ink-4">Days before travel · live from the platform policy engine</p>
                </div>
              </div>
              <div className="divide-y divide-ink-8">
                {TOUR_TIERS.map((t) => (
                  <div key={t.tier} className="flex items-center justify-between gap-4 px-6 sm:px-8 py-3.5 hover:bg-ink-9/40 transition-colors">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-ink">{t.tier}</div>
                      <div className="text-xs text-ink-4">Cancellation charge: {t.charge}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-xs font-bold">
                        {t.refund}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </MotionGlow>

          {/* ── Hotel ──────────────────────────────────────── */}
          <Card variant="premium" padded className="mb-10">
            <h2 className="font-extrabold text-lg text-ink mb-2">Hotel bookings</h2>
            <p className="text-sm text-ink-3 leading-relaxed">
              Each hotel sets its own cancellation ladder — typically free up to 72 hours before
              check-in, 75% up to 48 hours, 50% up to 24 hours, and no refund on the day.
              The exact policy is shown on the hotel page before you book, and in the refund
              preview before you cancel.
            </p>
          </Card>

          <div className="text-center">
            <a href="/bookings" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 text-white font-bold text-sm px-6 py-3 shadow-wt-sm hover:shadow-wt-md transition-shadow">
              Cancel a booking
            </a>
          </div>
        </Container>
      </Section>
    </>
  );
}
