import { Check, X } from "lucide-react";
import { Container, Section, SectionHeader } from "@/components/ui";
import { MotionStagger, MotionStaggerItem } from "@/components/ui";
import type { BandTone } from "@/types/cms";
import type { InclusionLine } from "@/components/tours/TourFilters";

/* ============================================================
   TourWhatIncludedBand — included / not included, counted.

   A tour's inclusions are authored per package, so the two lists here are
   the union of what the live packages actually declare, each line labelled
   with how many of the packages carry it. Nothing is asserted about a
   package that doesn't say it itself, and a line that only one package
   offers never sits in the headline list as if it were standard.
   ============================================================ */

export default function TourWhatIncludedBand({
  included,
  excluded,
  total,
  bg = "muted",
}: {
  included: InclusionLine[];
  excluded: InclusionLine[];
  total: number;
  bg?: BandTone;
}) {
  if (total === 0 || (included.length === 0 && excluded.length === 0)) return null;

  return (
    <Section bg={bg} pad="tight" id="inclusions">
      <Container size="xl">
        <SectionHeader
          eyebrow="What your money covers"
          title="What a WayTero tour includes"
          subtitle={`Counted across the ${total} tour package${total === 1 ? "" : "s"} live on WayTero today. Every package lists its own inclusions and exclusions on its page — this is what the catalogue declares in common.`}
          accent="primary"
          underline
          animatedEyebrow
          scale="home"
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {included.length > 0 && (
            <div className="rounded-2xl border border-ink-7 bg-white p-5">
              <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-ink">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check className="h-4 w-4" aria-hidden />
                </span>
                Usually included
              </h3>
              <MotionStagger className="mt-4 space-y-2.5">
                {included.map((line) => (
                  <MotionStaggerItem key={line.text}>
                    <div className="flex items-start gap-2.5 border-b border-ink-7 pb-2.5 last:border-0 last:pb-0">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                      <span className="min-w-0 flex-1 text-sm leading-relaxed text-ink-2">
                        {line.text}
                      </span>
                      <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-ink-4">
                        {line.count}/{total}
                      </span>
                    </div>
                  </MotionStaggerItem>
                ))}
              </MotionStagger>
            </div>
          )}

          {excluded.length > 0 && (
            <div className="rounded-2xl border border-ink-7 bg-white p-5">
              <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-ink">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-rose-100 text-rose-700">
                  <X className="h-4 w-4" aria-hidden />
                </span>
                Not included
              </h3>
              <MotionStagger className="mt-4 space-y-2.5">
                {excluded.map((line) => (
                  <MotionStaggerItem key={line.text}>
                    <div className="flex items-start gap-2.5 border-b border-ink-7 pb-2.5 last:border-0 last:pb-0">
                      <X className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" aria-hidden />
                      <span className="min-w-0 flex-1 text-sm leading-relaxed text-ink-2">
                        {line.text}
                      </span>
                      <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-ink-4">
                        {line.count}/{total}
                      </span>
                    </div>
                  </MotionStaggerItem>
                ))}
              </MotionStagger>
            </div>
          )}
        </div>

        <p className="mt-5 text-xs text-ink-4">
          The package page carries its own list, day-by-day itinerary and terms —
          read it before you book; it is the document your total is priced from.
        </p>
      </Container>
    </Section>
  );
}
