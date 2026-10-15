import Image from "next/image";
import { BadgeCheck } from "lucide-react";
import {
  Container,
  Section,
  SectionHeader,
  MotionStagger,
  MotionStaggerItem,
} from "@/components/ui";
import type { LandingHighlight } from "@/lib/landingIndex";

// ============================================================
// LandingHighlights — the "why book here" row. Admin-authored
// title/text pairs; icon is optional per item.
// <640: 1 col · sm: 2 · lg: 3-4 depending on count.
// ============================================================

export default function LandingHighlights({
  highlights,
  title,
}: {
  highlights: LandingHighlight[];
  title?: string | null;
}) {
  if (!highlights.length) return null;

  return (
    <Section bg="muted" pad="md">
      <Container size="xl">
        <SectionHeader
          eyebrow={title ? undefined : "Why WayTero"}
          title={title ?? "Why book with WayTero"}
          align="center"
        />
        <MotionStagger className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {highlights.map((h, i) => (
            <MotionStaggerItem key={i}>
              <div className="flex h-full gap-4 rounded-2xl border border-ink-7 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-wt-lg">
                <div className="shrink-0">
                  {h.icon_url ? (
                    <Image
                      src={h.icon_url}
                      alt=""
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-xl object-cover"
                    />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                      <BadgeCheck className="h-5 w-5" />
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink">{h.title}</h3>
                  {h.text && (
                    <p className="mt-1 text-sm leading-relaxed text-ink-4">{h.text}</p>
                  )}
                </div>
              </div>
            </MotionStaggerItem>
          ))}
        </MotionStagger>
      </Container>
    </Section>
  );
}
