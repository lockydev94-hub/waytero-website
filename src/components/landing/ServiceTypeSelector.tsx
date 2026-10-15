import Link from "next/link";
import { Building2, Car, MapPin } from "lucide-react";
import { Container, Section } from "@/components/ui";
import type { LandingLink, LandingPageType } from "@/lib/landingIndex";

// ============================================================
// ServiceTypeSelector — the vertical switch on a hub page.
// <640 horizontal snap-scroll pill rail · sm+ wrapped pills.
// Only links the verticals that actually exist for this place
// (the backend already omits supply-less siblings).
// ============================================================

const ICONS: Partial<Record<LandingPageType, typeof Car>> = {
  CITY_CABS: Car,
  CITY_HOTELS: Building2,
  STATE_HOTELS: Building2,
  CITY_TOURS: MapPin,
  STATE_TOURS: MapPin,
};

export default function ServiceTypeSelector({
  siblings,
  scopeName,
}: {
  siblings: LandingLink[];
  scopeName: string;
}) {
  const verticals = siblings.filter((s) => s.page_type && s.page_type !== "CITY_HUB");
  if (verticals.length < 2) return null;

  return (
    <Section bg="white" pad="sm">
      <Container size="xl">
        <p className="mb-3 text-sm font-bold text-ink">
          Book {scopeName} by service
        </p>
        <div className="-mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:px-0">
          {verticals.map((v) => {
            const Icon = ICONS[v.page_type!] ?? MapPin;
            return (
              <Link
                key={v.slug}
                href={v.href}
                className="inline-flex shrink-0 snap-start items-center gap-2 rounded-full border border-ink-7 bg-white px-4 py-2 text-sm font-semibold text-ink transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
              >
                <Icon className="h-4 w-4" />
                {v.label}
              </Link>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
