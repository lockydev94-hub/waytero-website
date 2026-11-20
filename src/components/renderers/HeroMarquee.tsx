import {
  Layers, ReceiptText, ShieldCheck, Store, Navigation, Headset, Star,
  MapPin, Zap, BadgePercent, Wallet, Plane, type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/ui";
import { pick } from "@/types/cms";

/**
 * HeroMarquee — the translucent pill that straddles the hero's bottom edge.
 *
 * A sibling of the hero rather than a child: HeroSection sets
 * `overflow-hidden` on its own 100dvh box, so anything pulled to its border
 * would be clipped. It used to carry a negative top margin so half the pill
 * sat on the hero photo; the proof band now sits between the two, so the pill
 * clears it instead of overlapping its figures.
 *
 * Server component, CSS-only animation — no client JS, so the strip cannot
 * cause a hydration mismatch and respects the global reduced-motion rule.
 */

interface MarqueeItem {
  icon?: string | null;
  label?: string | null;
  sublabel?: string | null;
}

const ICONS: Record<string, LucideIcon> = {
  Layers, ReceiptText, ShieldCheck, Store, Navigation, Headset, Star,
  MapPin, Zap, BadgePercent, Wallet, Plane,
};

export default function HeroMarquee({ variant }: { variant: Record<string, unknown> }) {
  // Admin-authored only (CMS → HERO → marquee_items). No items, no strip.
  const items = pick<MarqueeItem[]>(variant, "marquee_items", []).filter(
    (i) => !!i?.label?.trim(),
  );
  if (items.length === 0) return null;

  // Duplicated so the -50% translate loops without a visible seam.
  const strip = [...items, ...items];

  return (
    <div className="relative z-20 mt-4">
      <Container size="wide">
        <div
          className="overflow-hidden rounded-full border border-ink-7 bg-white/85 shadow-wt-xl backdrop-blur-xl [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]"
        >
          {/* No gap/padding on the track: each item carries its own trailing
              space, so the strip is exactly 2× one copy and the -50% loop
              restarts without a seam. */}
          <ul className="flex w-max animate-marquee items-center py-3 hover:[animation-play-state:paused]">
            {strip.map((item, i) => {
              const Icon = (item.icon && ICONS[item.icon]) || Layers;
              return (
                <li key={`${item.label}-${i}`} className="flex shrink-0 items-center pr-8">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 text-white shadow-wt-sm">
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="ml-3 flex flex-col leading-tight">
                    <span className="text-[13px] font-extrabold tracking-tight text-ink">
                      {item.label}
                    </span>
                    {item.sublabel && (
                      <span className="text-[11px] text-ink-4">{item.sublabel}</span>
                    )}
                  </span>
                  <span aria-hidden className="ml-8 h-1 w-1 rounded-full bg-primary-300" />
                </li>
              );
            })}
          </ul>
        </div>
      </Container>
    </div>
  );
}
