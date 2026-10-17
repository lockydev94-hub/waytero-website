import Link from "next/link";
import { ArrowRight, BedDouble, Car, MapPinned, RotateCcw } from "lucide-react";
import { Container, Section, SectionHeader, MotionStagger, MotionStaggerItem } from "@/components/ui";
import publicCmsService from "@/services/publicCms";
import { cabLadder, tourLadder, type LadderRow } from "@/lib/cancellationLadder";
import type { BandTone } from "@/types/cms";

/* ============================================================
   CancellationFactsBand — what happens to your money if you cancel.

   Rendered straight from GET /public/cancellation-policy using the same
   ladder the /refund table uses, so the two can't disagree. The hotel
   column quotes the admin note verbatim because each property sets its
   own terms and there is no platform-wide hotel ladder to print.

   Doc Ref: public_legal_api.py (cancellation-policy),
            booking/services/cancellation_policy.py
   ============================================================ */

function LadderCard({
  icon: Icon,
  name,
  rows,
  tone,
}: {
  icon: typeof Car;
  name: string;
  rows: LadderRow[];
  tone: string;
}) {
  return (
    <div className={`flex h-full flex-col rounded-2xl border p-5 ${tone}`}>
      <div className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 text-white shadow-wt-sm">
          <Icon className="h-[17px] w-[17px]" />
        </span>
        <span className="text-sm font-extrabold text-ink">{name}</span>
      </div>
      <dl className="mt-4 divide-y divide-ink-7 border-t border-ink-7 text-[13px]">
        {rows.map((r) => (
          <div key={r.tier} className="flex items-baseline justify-between gap-3 py-2">
            <dt className="text-ink-3">{r.tier}</dt>
            <dd className="shrink-0 text-right font-extrabold text-ink">{r.refund}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default async function CancellationFactsBand({
  bg = "muted",
  pad = "tight",
  eyebrow = "Money back",
  title = "What you get back if you cancel",
  subtitle = "Not a promise — the live tiers the refund engine applies to your booking, read from the platform's own policy settings. Refunds are credited to your WayTero wallet.",
}: {
  bg?: BandTone;
  pad?: "home" | "tight" | "sm" | "md" | "lg";
  eyebrow?: string;
  title?: string;
  subtitle?: string;
}) {
  const policy = await publicCmsService.getCancellationPolicy();
  if (!policy) return null;

  const hotelNote = (policy.hotel?.note ?? "").trim();
  // Cards take the opposite light step to the band, or they vanish into it.
  const cardTone = bg === "white" ? "border-ink-7 bg-ink-9/60" : "border-ink-7 bg-white";
  const stripTone = bg === "white" ? "border-ink-7 bg-white" : "border-ink-7 bg-white/70";

  return (
    <Section bg={bg} pad={pad} id="cancellation" overlay="dots-faint">
      <Container size="xl">
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          accent="primary"
          underline
          animatedEyebrow
          scale={pad === "home" || pad === "tight" ? "home" : "default"}
        />

        <MotionStagger className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <MotionStaggerItem className="h-full">
            <LadderCard icon={Car} name="Cabs" rows={cabLadder(policy.cab)} tone={cardTone} />
          </MotionStaggerItem>
          <MotionStaggerItem className="h-full">
            <LadderCard icon={MapPinned} name="Tours" rows={tourLadder(policy.tour)} tone={cardTone} />
          </MotionStaggerItem>
          <MotionStaggerItem className="h-full">
            <div className={`flex h-full flex-col rounded-2xl border p-5 ${cardTone}`}>
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 text-white shadow-wt-sm">
                  <BedDouble className="h-[17px] w-[17px]" />
                </span>
                <span className="text-sm font-extrabold text-ink">Hotels</span>
              </div>
              {hotelNote ? (
                <p className="mt-4 text-[13px] leading-relaxed text-ink-3">{hotelNote}</p>
              ) : (
                <p className="mt-4 text-[13px] leading-relaxed text-ink-3">
                  Every hotel publishes its own cancellation terms on its page, shown before you pay.
                </p>
              )}
              <Link
                href="/hotels"
                className="mt-auto inline-flex items-center gap-1 pt-4 text-xs font-extrabold text-primary-700 transition-colors hover:text-primary-800"
              >
                See the terms on a stay
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
          </MotionStaggerItem>
        </MotionStagger>

        <div className={`mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border px-5 py-4 ${stripTone}`}>
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ink-4">
            <RotateCcw className="h-3.5 w-3.5 text-primary-600" aria-hidden />
            The fine print, in full
          </span>
          <Link href="/refund" className="text-xs font-extrabold text-primary-700 hover:text-primary-800">
            Refund &amp; cancellation policy
          </Link>
          <Link href="/bookings" className="text-xs font-extrabold text-primary-700 hover:text-primary-800">
            Cancel from your bookings
          </Link>
          <Link href="/track" className="text-xs font-extrabold text-primary-700 hover:text-primary-800">
            Check a booking status
          </Link>
        </div>
      </Container>
    </Section>
  );
}
