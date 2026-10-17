import { getAvailability, serviceVisible, type ServiceKey } from "@/lib/availability";
import { Container, Section, SectionHeader, MotionStagger, MotionStaggerItem } from "@/components/ui";
import { API_BASE } from "@/lib/apiBase";
import Link from "next/link";
import { ArrowUpRight, BedDouble, Car, MapPinned } from "lucide-react";
import type { BandTone } from "@/types/cms";

/* ============================================================
   VerticalsBand — the three things WayTero sells, with the live
   supply count behind each one.

   service-types gives the admin-authored label; GET /public/availability
   gives the count, counted from the booking tables rather than the copy.
   The two are different units on purpose (cities with a quotable fare vs.
   live listings), so each vertical carries its own noun instead of one
   shared "supplies" label. A vertical that is disabled or has no supply is
   dropped, because its target page 404s.

   service_types.image_url is deliberately not rendered — the banner artwork
   is admin stock imagery and it has read badly everywhere it has been used.

   Doc Ref: public_availability.py:143-162, public_service_types feed
   ============================================================ */

interface ServiceTypeRow {
  type_code?: string;
  label?: string;
}

const VERTICALS_COPY: Record<ServiceKey, { icon: typeof Car; path: string; countNoun: (n: number) => string; line: string; cta: string }> = {
  CAB: {
    icon: Car,
    path: "/cabs",
    countNoun: (n) => `${n} ${n === 1 ? "city" : "cities"} with a set fare`,
    line: "Local, airport and outstation rides, priced by the same fare engine that bills your booking — base fare, per-km rate and GST shown up front.",
    cta: "Book a cab",
  },
  HOTEL: {
    icon: BedDouble,
    path: "/hotels",
    countNoun: (n) => `${n} ${n === 1 ? "stay" : "stays"} bookable`,
    line: "Partner hotels with photos, guest ratings and a published nightly price. Each property sets its own cancellation ladder, shown on its page before you pay.",
    cta: "Find a stay",
  },
  TOUR: {
    icon: MapPinned,
    path: "/tours",
    countNoun: (n) => `${n} tour ${n === 1 ? "package" : "packages"}`,
    line: "Multi-day packages with a day-by-day itinerary, itemised inclusions and exclusions, and one total for your traveller count.",
    cta: "Browse packages",
  },
};

export default async function VerticalsBand({
  bg = "white",
  pad = "tight",
  eyebrow = "What we sell",
  title = "Three verticals, one account, one wallet",
  subtitle = "Every number below is what the booking feeds report right now — the same counts that decide which pages of this site exist.",
}: {
  bg?: BandTone;
  pad?: "home" | "tight" | "sm" | "md" | "lg";
  eyebrow?: string;
  title?: string;
  subtitle?: string;
}) {
  const av = await getAvailability();
  let types: ServiceTypeRow[] = [];
  try {
    const res = await fetch(`${API_BASE}/public/service-types`, { next: { revalidate: 300 } });
    if (res.ok) {
      const data = (await res.json()) as unknown;
      types = (Array.isArray(data) ? data : (data as { items?: ServiceTypeRow[] })?.items ?? []) as ServiceTypeRow[];
    }
  } catch {
    types = [];
  }

  const adminLabel = new Map<string, string>();
  for (const t of types) {
    const code = (t.type_code ?? "").trim().toUpperCase();
    const label = (t.label ?? "").trim();
    if (code && label) adminLabel.set(code, label);
  }

  const keys = (["CAB", "HOTEL", "TOUR"] as ServiceKey[]).filter((k) => serviceVisible(av, k));
  if (!keys.length) return null;

  // White cards need the muted step and vice versa, or the panel vanishes
  // into a same-tone band. Literal strings only — never a composed class.
  const cardTone =
    bg === "white"
      ? "border-ink-7 bg-ink-9/60 hover:border-primary-300"
      : "border-ink-7 bg-white hover:border-primary-300";

  return (
    <Section bg={bg} pad={pad} overlay="dots-faint">
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

        <MotionStagger className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {keys.map((key) => {
            const c = VERTICALS_COPY[key];
            const Icon = c.icon;
            const supply = av.services[key]?.supply_count ?? 0;
            return (
              <MotionStaggerItem key={key} className="h-full">
                <Link
                  href={c.path}
                  className={`group flex h-full flex-col rounded-2xl border p-5 transition-all duration-300 ease-[var(--ease-wt)] hover:-translate-y-0.5 hover:shadow-wt-lg ${cardTone}`}
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 text-white shadow-wt-sm transition-transform duration-300 group-hover:scale-110">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="mt-4 text-base font-extrabold text-ink group-hover:text-primary-700">
                    {adminLabel.get(key) ?? c.cta}
                  </span>
                  <span className="mt-1 text-[11px] font-bold uppercase tracking-wide text-primary-700">
                    {c.countNoun(supply)}
                  </span>
                  <span className="mt-3 text-[13px] leading-relaxed text-ink-3">{c.line}</span>
                  <span className="mt-auto inline-flex items-center gap-1 pt-4 text-xs font-extrabold text-primary-700">
                    {c.cta}
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              </MotionStaggerItem>
            );
          })}
        </MotionStagger>
      </Container>
    </Section>
  );
}
