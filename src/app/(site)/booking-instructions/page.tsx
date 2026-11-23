import Link from "next/link";
import { ArrowRight, Car, Compass, Hotel, LifeBuoy } from "lucide-react";
import PageHero, { HeroAside } from "@/components/sections/PageHero";
import ProseBand from "@/components/sections/ProseBand";
import CancellationFactsBand from "@/components/sections/CancellationFactsBand";
import { CtaSection } from "@/components/renderers";
import { getPageBody, resolvePage, sourceNote } from "@/lib/pageBody";
import { PAGE_BODIES } from "@/content/pageBodies";
import { getAvailability, serviceVisible, type ServiceKey } from "@/lib/availability";
import { pageMetadata, type SeoContent } from "@/services/seoService";
import StaticPageSeo from "@/components/sections/StaticPageSeo";

const META_FALLBACK: SeoContent = {
  title: "Booking Instructions — WayTero",
  description:
    "How to book a cab, a hotel or a tour on WayTero, what you pay and when, and what happens after you confirm.",
  keywords: ["how to book", "cab booking steps", "hotel booking", "tour booking", "WayTero"],
};

export async function generateMetadata(): Promise<import("next").Metadata> {
  return pageMetadata("booking-instructions", "/booking-instructions", META_FALLBACK);
}

const STARTERS: { key: ServiceKey; label: string; href: string; icon: typeof Car }[] = [
  { key: "CAB", label: "Book a cab", href: "/cabs", icon: Car },
  { key: "HOTEL", label: "Find a stay", href: "/hotels", icon: Hotel },
  { key: "TOUR", label: "Browse tour packages", href: "/tours", icon: Compass },
];

export default async function BookingInstructionsPage() {
  const [state, av] = await Promise.all([getPageBody("booking-instructions"), getAvailability()]);
  const page = resolvePage(state, PAGE_BODIES["booking-instructions"]);

  return (
    <>
      <StaticPageSeo pageKey="booking-instructions" path="/booking-instructions" name="How Booking Works" crumb="Booking" />
      <PageHero
        eyebrow={page.eyebrow ?? "Guide"}
        title={page.title}
        accent="Instructions"
        description={page.description}
        meta={page.meta}
        side={
          <HeroAside title="Start here">
            <ul className="space-y-3 text-sm">
              {STARTERS.filter((s) => serviceVisible(av, s.key)).map((s) => (
                <li key={s.key}>
                  <Link
                    href={s.href}
                    className="group flex items-center gap-2 font-bold text-ink-2 hover:text-primary-700"
                  >
                    <s.icon className="h-4 w-4 shrink-0 text-primary-600" aria-hidden />
                    {s.label}
                    <ArrowRight
                      className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100"
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/support"
                  className="group flex items-center gap-2 font-bold text-ink-2 hover:text-primary-700"
                >
                  <LifeBuoy className="h-4 w-4 shrink-0 text-primary-600" aria-hidden />
                  Something went wrong after I booked
                  <ArrowRight
                    className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100"
                    aria-hidden
                  />
                </Link>
              </li>
            </ul>
          </HeroAside>
        }
      />

      <ProseBand
        sections={page.sections}
        bg="muted"
        eyebrow="Step by step"
        title="What you do, and what happens next"
        source={sourceNote(page.source)}
      />

      <CancellationFactsBand bg="white" />

      <CtaSection
        variant={{
          headline: "Ready when you are",
          subtitle:
            "Fare, advance and cancellation terms are all shown before you pay — start with the one you need.",
          cta_text: "Book a cab",
          cta_link: "/cabs",
        }}
        bg="muted"
        pad="tight"
        cardSize="compact"
        secondary={{ label: "Track a booking", href: "/track" }}
      />
    </>
  );
}
