import {
  ArrowRight,
  Building2,
  Car,
  FileStack,
  Hotel,
  Map,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import {
  Container,
  Section,
  SectionHeader,
  Card,
  IconBox,
  MotionGlow,
  ButtonLink,
} from "@/components/ui";
import { MotionStagger, MotionStaggerItem } from "@/components/ui";
import { CtaSection } from "@/components/renderers";
import LandingStatsStrip from "@/components/landing/LandingStatsStrip";
import CoverageBand from "@/components/sections/CoverageBand";
import PartnerProcessBand from "@/components/sections/PartnerProcessBand";
import PageFaq, { type FaqItem } from "@/components/sections/PageFaq";
import JsonLd, { faqPageSchema } from "@/components/sections/JsonLd";
import PartnerApplicationCard from "./partner-application-form";
import publicCmsService from "@/services/publicCms";
import type { LandingStat } from "@/lib/landingIndex";

/* ============================================================
   /partner — the supply side of the same honesty rule used on /about.

   Every claim here maps to an endpoint or a column:
     48-hour answer, one application per mobile  public_leads_api.py
     KYC / bank / GST uploads, start PENDING     partner/api.py,
                                                 partner_documents
     enable or disable a service type            partner/api.py
     commission group + per-service rates        partner/api.py
     settleable = COMPLETED + invoiced + paid    settlement_api.py
   "Instant payouts", "daily settlements" and "no contracts, no
   minimums" are gone: settlement is finance-run against completed
   bookings, and onboarding needs documents, GST and bank details.
   ============================================================ */

const PERKS = [
  {
    icon: Users,
    title: "Real demand",
    desc: "Travellers already searching cabs, hotels and tours in the cities WayTero sells in — not an audience you have to build.",
    tone: "primary" as const,
  },
  {
    icon: TrendingUp,
    title: "Priced by you",
    desc: "You publish the fare, the nightly rate and the package price. What the traveller sees before they confirm is what you set.",
    tone: "success" as const,
  },
  {
    icon: Wallet,
    title: "Settled on completed bookings",
    desc: "A booking becomes settleable once it is completed, invoiced and paid in full. Finance runs the settlement through your partner desk.",
    tone: "accent" as const,
  },
  {
    icon: Building2,
    title: "Your own partner desk",
    desc: "KPIs, wallet, vehicles or rooms, recent bookings and a monthly chart — plus the commission rate that applies to each service.",
    tone: "info" as const,
  },
];

export default async function PartnerPage() {
  // Null when the API is unreachable — every number below is then omitted
  // rather than printed as zero.
  const counts = await publicCmsService.getHomepageBandCounts();
  const cabCities = counts?.POPULAR_CITIES ?? 0;
  const routes = counts?.POPULAR_ROUTES ?? 0;
  const hotels = counts?.FEATURED_HOTELS ?? 0;
  const tours = counts?.TOUR_PACKAGES ?? 0;

  const stats: LandingStat[] = [];
  if (cabCities > 0) stats.push({ value: cabCities, label: "cities we sell cabs in today" });
  if (routes > 0) stats.push({ value: routes, label: "routes with a live fare" });
  if (hotels > 0) stats.push({ value: hotels, label: "hotels already bookable" });
  if (tours > 0) stats.push({ value: tours, label: "tour packages live" });

  const types = [
    {
      icon: Car,
      title: "Cab operators",
      apply: "Apply as a cab partner",
      desc: "Add vehicles and fares; bookings arrive against the route the traveller actually searched.",
      count: cabCities > 0 ? `${cabCities} cities with cab demand today` : null,
    },
    {
      icon: Hotel,
      title: "Hotels & homestays",
      apply: "List your property",
      desc: "List rooms with your own nightly rate and availability, and manage the inventory from the portal.",
      count: hotels > 0 ? `${hotels} properties already on the shelf` : null,
    },
    {
      icon: Map,
      title: "Tour operators",
      apply: "Apply as a tour partner",
      desc: "Publish itineraries with their inclusions and exclusions, priced per traveller count.",
      count: tours > 0 ? `${tours} packages live right now` : null,
    },
  ];

  const faqs: FaqItem[] = [
    {
      question: "What does it cost to list with WayTero?",
      answer:
        "Commission is set on your partner account and differs by service. The partner portal shows your commission group and the rate that applies to each service, so you can see what a booking will cost you before you accept it.",
    },
    {
      question: "When does a booking become settleable?",
      answer:
        "Once it is completed, its invoice has been generated and the customer's balance has been collected in full. Finance then settles it through your partner desk. There is no daily auto-payout and no automatic deduction — which is why the wait is short but not instant.",
    },
    {
      question: "Which documents do I have to upload?",
      answer:
        "KYC documents and a bank account. Company partners add GST details. Each upload starts as pending and is verified before it counts, so apply only when you can get these together.",
    },
    {
      question: "Can I take my inventory offline again?",
      answer:
        "Yes. You enable or disable each service type on your own account from the portal, which is what governs whether your inventory appears in search.",
    },
    {
      question: "We operate outside the cities listed above.",
      answer:
        "Apply anyway — but judge the opportunity on the coverage this page shows, not on a promise about tomorrow. The demand we can point you at today is the list above.",
    },
  ];

  return (
    <>
      <JsonLd data={faqPageSchema(faqs)} />

      <Section bg="white" pad="tight" className="bg-gradient-to-br from-accent-50/60 via-white to-primary-50/40">
        <Container size="xl">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-center">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary-600 mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-500" aria-hidden />
                Partner program
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-ink leading-[1.1] tracking-tight">
                Put your business in front of <span className="text-gradient-primary">travellers booking today</span>
              </h1>
              <p className="mt-4 max-w-2xl text-base sm:text-lg text-ink-3 leading-relaxed">
                Cab fleets, hotels and tour operators in the cities WayTero sells in. Apply, upload your
                documents, and get settled against completed bookings you can audit in your own portal.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <ButtonLink href="#apply" variant="gradient-primary" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Apply now
                </ButtonLink>
                <ButtonLink href="/contact" variant="outline" size="lg" className="border-ink-3/30 text-ink hover:bg-ink-9/40">
                  Talk to partnerships
                </ButtonLink>
              </div>
            </div>

            {/* What a partner has to be ready for — the three things the
                engine actually checks, each an anchor into the bands below.
                #process and #apply are static sections, #coverage only exists
                while the city feeds have rows, so that line is gated. */}
            <div className="rounded-3xl border border-ink-7 bg-white/80 p-6 backdrop-blur-sm">
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink">Before you apply</h2>
              <ul className="mt-4 space-y-3 text-sm">
                {counts && (
                  <li>
                    <a href="#coverage" className="group flex items-center gap-2 font-bold text-ink-2 hover:text-primary-700">
                      <Map className="h-4 w-4 shrink-0 text-primary-600" aria-hidden />
                      Check the cities we sell in today
                      <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                    </a>
                  </li>
                )}
                <li>
                  <a href="#process" className="group flex items-center gap-2 font-bold text-ink-2 hover:text-primary-700">
                    <FileStack className="h-4 w-4 shrink-0 text-primary-600" aria-hidden />
                    Read how onboarding actually runs
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                  </a>
                </li>
                <li>
                  <a href="#apply" className="group flex items-center gap-2 font-bold text-ink-2 hover:text-primary-700">
                    <Wallet className="h-4 w-4 shrink-0 text-primary-600" aria-hidden />
                    Have KYC, bank and GST details ready
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      <LandingStatsStrip stats={stats} title="The demand that already exists" bg="muted" pad="tight" />

      <Section bg="white" pad="tight" overlay="dots-faint">
        <Container size="lg">
          <SectionHeader
            eyebrow="What you get"
            title="Why partners list with WayTero"
            subtitle="Four things the platform actually does for you. Nothing here is a promise about how fast money moves."
            accent="primary"
            underline
            animatedEyebrow
            scale="home"
          />
          <MotionStagger className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PERKS.map((p) => {
              const Icon = p.icon;
              const glowColor = ((p.tone as string) === "info" ? "primary" : p.tone) as "primary" | "accent" | "success" | "danger";
              return (
                <MotionStaggerItem key={p.title} className="h-full">
                  <MotionGlow color={glowColor} intensity={0.18} size={260} className="h-full rounded-2xl">
                    <Card variant="premium" hover lift="md" hoverTint="primary" className="group h-full">
                      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <IconBox
                        icon={<Icon />}
                        tone={p.tone}
                        size="md"
                        gradient
                        glow
                        className="mb-4 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300"
                      />
                      <h3 className="font-bold text-ink mb-1.5 group-hover:text-primary-700 transition-colors">{p.title}</h3>
                      <p className="text-sm text-ink-3 leading-relaxed">{p.desc}</p>
                    </Card>
                  </MotionGlow>
                </MotionStaggerItem>
              );
            })}
          </MotionStagger>
        </Container>
      </Section>

      <CoverageBand
        bg="muted"
        pad="tight"
        eyebrow="Where bookings come from"
        title="The coverage you would be listing into"
        subtitle="Every city below has live supply on WayTero right now. This is the demand you are being asked to add inventory to."
      />

      <Section bg="white" pad="tight" overlay="dots-faint">
        <Container size="lg">
          <SectionHeader
            eyebrow="Choose your track"
            title="Three kinds of partner"
            accent="primary"
            underline
            animatedEyebrow
            scale="home"
          />
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
            {types.map((t) => {
              const Icon = t.icon;
              return (
                <MotionGlow key={t.title} color="primary" intensity={0.15} size={300} className="h-full rounded-2xl">
                  <Card variant="premium" hover lift="lg" hoverTint="primary" className="group flex h-full flex-col text-center">
                    <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="inline-flex self-center">
                      <IconBox
                        icon={<Icon />}
                        tone="primary"
                        size="lg"
                        gradient
                        glow
                        className="group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300"
                      />
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-ink group-hover:text-primary-700 transition-colors">{t.title}</h3>
                    <p className="mt-2 text-sm text-ink-3 leading-relaxed">{t.desc}</p>
                    {t.count && (
                      <p className="mt-3 inline-flex self-center items-center gap-1.5 rounded-full border border-ink-7 bg-ink-9/60 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-primary-700">
                        {t.count}
                      </p>
                    )}
                    <div className="mt-auto pt-5">
                      <ButtonLink href="#apply" variant="gradient-primary" size="md" fullWidth shine>
                        {t.apply}
                      </ButtonLink>
                    </div>
                  </Card>
                </MotionGlow>
              );
            })}
          </div>
        </Container>
      </Section>

      <PartnerProcessBand bg="muted" pad="tight" />

      <Section bg="white" pad="tight" id="apply" className="bg-mesh-primary">
        <Container size="md">
          <SectionHeader
            eyebrow="Start here"
            title="Apply to become a partner"
            subtitle="Tell us about your business. The partnerships team answers within 48 hours."
            accent="primary"
            underline
            animatedEyebrow
            scale="home"
          />
          <div className="mt-6">
            <PartnerApplicationCard />
          </div>
        </Container>
      </Section>

      <PageFaq
        faqs={faqs}
        eyebrow="Straight answers"
        title="What partners ask us first"
        pad="tight"
        overlay="dots-faint"
      />

      <CtaSection
        variant={{
          title: "Not sure which track fits?",
          subtitle: "Describe your business and the partnerships team will tell you what listing on WayTero would actually involve.",
          cta_text: "Talk to us",
          cta_link: "/contact",
        }}
        bg="white"
        pad="tight"
        cardSize="compact"
        secondary={{ label: "How onboarding runs", href: "#process" }}
      />
    </>
  );
}
