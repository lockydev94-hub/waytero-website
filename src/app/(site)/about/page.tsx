import Link from "next/link";
import {
  ArrowRight,
  Car,
  Heart,
  MapPinned,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Award,
} from "lucide-react";
import {
  Container,
  Section,
  SectionHeader,
  IconBox,
  Card,
  MotionGlow,
  ButtonLink,
} from "@/components/ui";
import { MotionStagger, MotionStaggerItem } from "@/components/ui";
import { CtaSection } from "@/components/renderers";
import LandingStatsStrip from "@/components/landing/LandingStatsStrip";
import LandingSteps from "@/components/landing/LandingSteps";
import PageFaq, { type FaqItem } from "@/components/sections/PageFaq";
import JsonLd, { faqPageSchema } from "@/components/sections/JsonLd";
import CoverageBand from "@/components/sections/CoverageBand";
import VerticalsBand from "@/components/sections/VerticalsBand";
import CancellationFactsBand from "@/components/sections/CancellationFactsBand";
import publicCmsService from "@/services/publicCms";
import { getAvailability, serviceVisible } from "@/lib/availability";
import { pageMetadata, type SeoContent } from "@/services/seoService";
import type { LandingStat } from "@/lib/landingIndex";

const FALLBACK: SeoContent = {
  title: "About Us — WayTero",
  description:
    "WayTero is a Bhubaneswar-based travel platform connecting customers, partners, drivers and hotels for cabs, stays and Odisha tours.",
  keywords: [
    "about WayTero",
    "travel platform Bhubaneswar",
    "Odisha travel company",
    "Bhubaneswar cab company",
  ],
};

export async function generateMetadata(): Promise<import("next").Metadata> {
  return pageMetadata("about", "/about", FALLBACK);
}

const VALUES = [
  { icon: Heart, title: "Customer first", desc: "Every decision starts with one question: is this better for the traveler?", tone: "primary" as const },
  {
    icon: ShieldCheck,
    title: "Trust over shortcuts",
    desc: "Verified partners, prices from the engine that bills you, and a refund ladder you can read before you pay.",
    tone: "success" as const,
  },
  {
    icon: Sparkles,
    title: "Built for real trips",
    desc: "A small-town outstation run and a metro airport transfer sit in the same account, with the same wallet.",
    tone: "accent" as const,
  },
  { icon: Award, title: "Quality, not volume", desc: "We measure success by trips delivered as promised, not by sign-ups.", tone: "info" as const },
];

// "Our journey" timeline removed 2026-10-15: the milestone dates and
// numbers ("First 1,000 partners across 12 cities", "Travel Wallet
// launched 2025") were invented history with no source of truth in the DB.

export default async function AboutPage() {
  // Both feeds fail soft — null availability means the band-count guard below
  // skips every stat, and null counts means the strip renders nothing.
  const [av, counts, policy] = await Promise.all([
    getAvailability(),
    publicCmsService.getHomepageBandCounts(),
    publicCmsService.getCancellationPolicy(),
  ]);

  const stats: LandingStat[] = [];
  const cabCities = counts?.POPULAR_CITIES ?? 0;
  const routes = counts?.POPULAR_ROUTES ?? 0;
  const hotels = counts?.FEATURED_HOTELS ?? 0;
  const tours = counts?.TOUR_PACKAGES ?? 0;
  if (cabCities > 0) stats.push({ value: cabCities, label: "cities with live cab fares" });
  if (routes > 0) stats.push({ value: routes, label: "routes with a set fare" });
  if (hotels > 0) stats.push({ value: hotels, label: "hotels bookable today" });
  if (tours > 0) stats.push({ value: tours, label: "tour packages live" });

  // Authored, engine-checked answers. Every number quoted below is read from
  // the live policy / band-count payload, so an admin edit re-answers it.
  const faqs: FaqItem[] = [
    {
      question: "What can I actually book on WayTero today?",
      answer:
        "Cabs, hotels and tour packages — and the counts on this page are the rows in the booking tables, not a marketing estimate. A vertical with no supply has its pages taken down rather than left up as an empty search form.",
    },
    {
      question: "Where do the prices on this site come from?",
      answer:
        "Cab fares come from the same engine that prices a real booking: base fare with its included kilometres, a per-km rate beyond that, driver allowance, and tolls or night charges where they apply. Hotels publish a nightly rate per room, and tour packages are priced per package at your traveller count, with inclusions and exclusions listed. The total you pay, taxes included where the platform charges them, is on screen before you confirm anything.",
    },
    {
      question: "What happens to my money if I cancel?",
      answer: policy
        ? `Cabs: cancel at least ${policy.cab.free_hours} hours before pickup and the cancellation is free — the full amount returns to your WayTero wallet. Once a driver is assigned and preparing, ${policy.cab.after_assignment_percent}% returns, because the partner has already blocked that slot. Tours follow a day ladder that starts at ${policy.tour.tier_1_percent}% back from ${policy.tour.free_days} days out. Every tier is on this page, and a refund is never more than the advance you actually paid.`
        : "Cabs and tours each follow a published time-based ladder, shown on this page and at the moment you cancel. Refunds are credited to your WayTero wallet and capped at the advance you actually paid.",
    },
    {
      question: "Can I watch my cab move on a map?",
      answer:
        "No — and we would rather say so than promise something we do not run. The track page gives you the booking status and, once a partner accepts, the driver's name, vehicle number and contact number. There is no live GPS feed or ETA on this platform.",
    },
    {
      question: "How do I join as a partner?",
      answer:
        "Apply on the partner page with your documents — identity, GST where applicable, and bank details. Applications are reviewed and answered within 48 hours. Settlement runs against completed bookings: an invoice is generated and the balance collected before payout, through the partner desk rather than an automatic deduction.",
    },
  ];

  return (
    <>
      <JsonLd data={faqPageSchema(faqs)} />

      <Section bg="white" pad="tight">
        <Container size="xl">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-center">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary-600 mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-500" aria-hidden />
                About WayTero
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-ink leading-[1.1] tracking-tight">
                We&apos;re building <span className="text-gradient-primary">Odisha&apos;s Travel Operating System</span>
              </h1>
              <p className="mt-4 max-w-2xl text-base sm:text-lg text-ink-3 leading-relaxed">
                One platform for cabs, hotels and tour packages — where every price,
                every policy and every number on this page comes out of the same
                database that takes your booking.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                {serviceVisible(av, "CAB") && (
                  <ButtonLink href="/cabs" variant="gradient-primary" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                    Book a cab
                  </ButtonLink>
                )}
                {serviceVisible(av, "HOTEL") && (
                  <ButtonLink href="/hotels" variant="outline" size="lg" className="border-ink-3/30 text-ink hover:bg-ink-9/40">
                    Browse hotels
                  </ButtonLink>
                )}
                <ButtonLink href="/partner" variant="outline" size="lg" className="border-ink-3/30 text-ink hover:bg-ink-9/40">
                  Become a partner
                </ButtonLink>
              </div>
            </div>

            {/* The promise of this page is that it can be checked. Each line is
                an anchor into the bands below, or into the live policy — so a
                line only appears when the band it points at has data to
                render. With the API unreachable both bands return null and a
                dead in-page anchor would scroll nowhere. */}
            <div className="rounded-3xl border border-ink-7 bg-ink-9/60 p-6">
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink">Proof, not promises</h2>
              <ul className="mt-4 space-y-3 text-sm">
                {counts && (
                  <li>
                    <a href="#coverage" className="group flex items-center gap-2 font-bold text-ink-2 hover:text-primary-700">
                      <MapPinned className="h-4 w-4 shrink-0 text-primary-600" aria-hidden />
                      The cities with live supply
                      <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                    </a>
                  </li>
                )}
                {policy && (
                  <li>
                    <a href="#cancellation" className="group flex items-center gap-2 font-bold text-ink-2 hover:text-primary-700">
                      <RotateCcw className="h-4 w-4 shrink-0 text-primary-600" aria-hidden />
                      The refund tiers we actually apply
                      <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                    </a>
                  </li>
                )}
                <li>
                  <Link href="/track" className="group flex items-center gap-2 font-bold text-ink-2 hover:text-primary-700">
                    <Car className="h-4 w-4 shrink-0 text-primary-600" aria-hidden />
                    Check any booking you have made
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      <LandingStatsStrip stats={stats} title="Live on WayTero today" bg="muted" pad="tight" />

      <Section bg="white" pad="tight" overlay="dots-faint">
        <Container size="lg">
          <SectionHeader
            eyebrow="What we stand for"
            title="Our values"
            accent="primary"
            underline
            animatedEyebrow
            scale="home"
          />
          <MotionStagger className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {VALUES.map((v) => {
              const Icon = v.icon;
              const glowColor = ((v.tone as string) === "info" ? "primary" : v.tone) as "primary" | "accent" | "success" | "danger";
              return (
                <MotionStaggerItem key={v.title} className="h-full">
                  <MotionGlow color={glowColor} intensity={0.18} size={260} className="h-full rounded-2xl">
                    <Card variant="premium" hover lift="md" hoverTint="primary" className="group h-full">
                      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <IconBox
                        icon={<Icon />}
                        tone={v.tone}
                        size="md"
                        gradient
                        glow
                        className="mb-4 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300"
                      />
                      <h3 className="font-bold text-ink mb-1.5 group-hover:text-primary-700 transition-colors">
                        {v.title}
                      </h3>
                      <p className="text-sm text-ink-3 leading-relaxed">{v.desc}</p>
                    </Card>
                  </MotionGlow>
                </MotionStaggerItem>
              );
            })}
          </MotionStagger>
        </Container>
      </Section>

      <CoverageBand bg="muted" pad="tight" />

      <VerticalsBand bg="white" pad="tight" />

      <CancellationFactsBand bg="muted" pad="tight" />

      <LandingSteps serviceType="DEFAULT" bg="white" pad="tight" title="Booking with WayTero" />

      <PageFaq
        faqs={faqs}
        eyebrow="Good to know"
        title="Questions people actually ask us"
        pad="tight"
        overlay="dots-faint"
      />

      <CtaSection
        variant={{
          title: "Travel with WayTero",
          subtitle: "Book cabs, hotels and tours with upfront, GST-inclusive pricing — priced by the same engine that takes your booking.",
          cta_text: "Browse hotels",
          cta_link: "/hotels/results",
        }}
        bg="white"
        pad="tight"
        cardSize="compact"
      />
    </>
  );
}
