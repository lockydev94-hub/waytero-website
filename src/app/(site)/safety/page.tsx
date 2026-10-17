import { Phone, Siren, BadgeCheck, Search, Wallet, Headphones } from "lucide-react";
import {
  Container, Section, SectionHeader, Card, IconBox, ButtonLink,
  MotionStagger, MotionStaggerItem, MotionGlow,
} from "@/components/ui";
import PageHero from "@/components/sections/PageHero";
import ProseBand from "@/components/sections/ProseBand";
import TrackStatusLegend from "@/components/sections/TrackStatusLegend";
import PageFaq from "@/components/sections/PageFaq";
import JsonLd, { faqPageSchema } from "@/components/sections/JsonLd";
import { CtaSection } from "@/components/renderers";
import { getPageBody, resolvePage, sourceNote } from "@/lib/pageBody";
import { getDesk } from "@/lib/desk";
import { PAGE_BODIES } from "@/content/pageBodies";
import { pageMetadata, type SeoContent } from "@/services/seoService";

const META_FALLBACK: SeoContent = {
  title: "Safety — WayTero",
  description:
    "How WayTero checks a partner before it goes live, what Track actually answers about a trip, how payments are handled, and what to do if something goes wrong.",
  // Meta keywords are read by nobody, but a page should not describe itself
  // with a capability it does not have.
  keywords: ["travel safety India", "verified drivers", "booking status tracking", "WayTero"],
};

export async function generateMetadata(): Promise<import("next").Metadata> {
  return pageMetadata("safety", "/safety", META_FALLBACK);
}

// Four, not six: the two pillars this page used to advertise — a live trip map
// and an always-on safety desk — describe tooling the platform does not run.
// What replaces them is what the code does today, read from the same
// components the rest of the site uses.
const PILLARS = [
  {
    icon: BadgeCheck,
    title: "Checked before they go live",
    desc: "Vehicle registration, insurance and licence for a cab partner; business and property documents for a hotel or operator. A person on the team reads them before the listing appears.",
    tone: "success" as const,
  },
  {
    icon: Search,
    title: "Traceable by booking number",
    desc: "Track answers with the status and, once a driver is assigned, the name, vehicle number and a masked mobile. No live map and no GPS position — the honest version of traceable.",
    tone: "primary" as const,
  },
  {
    icon: Wallet,
    title: "Payment stays at the gateway",
    desc: "Card and UPI run on the payment gateway; WayTero keeps the reference, the amount and the status, never the card number. Cash advances are recorded on the booking.",
    tone: "accent" as const,
  },
  {
    icon: Headphones,
    title: "A person, on staffed hours",
    desc: "The desk is staffed on the hours printed on this page. Outside them WhatsApp and email still reach the team, and the answer comes the next working day.",
    tone: "info" as const,
  },
];

function SafetyPillars() {
  return (
    <Section bg="muted" pad="tight" id="how" overlay="dots-faint">
      <Container size="lg">
        <SectionHeader
          eyebrow="What is real today"
          title="Safety, by design"
          accent="primary"
          underline
          animatedEyebrow
          scale="home"
        />
        <MotionStagger className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            const glow = (p.tone === "info" ? "primary" : p.tone) as
              | "primary" | "accent" | "success" | "danger";
            return (
              <MotionStaggerItem key={p.title} className="h-full">
                <MotionGlow color={glow} intensity={0.15} size={260} className="h-full rounded-2xl">
                  <Card variant="premium" hover lift="sm" hoverTint="primary" className="h-full">
                    <IconBox
                      icon={<Icon />}
                      tone={p.tone}
                      size="md"
                      gradient
                      glow
                      className="mb-4 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300"
                    />
                    <h3 className="font-bold text-ink mb-1.5 group-hover:text-primary-700 transition-colors">
                      {p.title}
                    </h3>
                    <p className="text-sm text-ink-3 leading-relaxed">{p.desc}</p>
                  </Card>
                </MotionGlow>
              </MotionStaggerItem>
            );
          })}
        </MotionStagger>
      </Container>
    </Section>
  );
}

/** The emergency panel. `112` leads because a trip support line is not a
 *  substitute for the police, and the hours are read from the platform profile
 *  so this band cannot drift away from the header's. */
async function EmergencyBand() {
  const desk = await getDesk();
  return (
    <Section bg="white" pad="tight" id="emergency" overlay="grid-faint">
      <Container size="lg">
        <div className="relative overflow-hidden rounded-3xl border border-ink-7 bg-gradient-to-br from-ink via-ink-800 to-primary-900 text-white px-7 py-8 lg:px-10 lg:py-10 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-center shadow-premium">
          <div aria-hidden className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-red-500/25 blur-3xl" />
          <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

          <div className="flex items-start gap-4 relative">
            <div className="h-12 w-12 rounded-2xl bg-red-500/90 text-white inline-flex items-center justify-center shrink-0 shadow-wt-accent">
              <Siren className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl lg:text-2xl font-extrabold tracking-tight">
                In danger, call 112 first
              </h2>
              <p className="mt-1.5 text-sm text-white/75 max-w-lg leading-relaxed">
                The national emergency number reaches the police, an ambulance or the fire service —
                we cannot. Tell us about the booking after that: the desk is staffed{" "}
                {desk.hours}, and a message left outside those hours is picked up the next working day.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 relative">
            <a
              href={desk.tel}
              className="group/cta inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-accent-500 hover:bg-accent-600 text-ink font-bold transition-all duration-300 ease-[var(--ease-wt)] shadow-wt-accent hover:-translate-y-0.5 overflow-hidden relative"
            >
              <span aria-hidden className="pointer-events-none absolute inset-y-0 w-1/3 bg-white/25 blur-md animate-shine" />
              <Phone className="h-4 w-4 relative" aria-hidden />
              <span className="relative">{desk.phone}</span>
            </a>
            <ButtonLink
              href="/support"
              variant="ghost"
              size="lg"
              className="text-white border-white/25 hover:bg-white/10"
            >
              All the ways to reach us
            </ButtonLink>
          </div>
        </div>
      </Container>
    </Section>
  );
}

export default async function SafetyPage() {
  const [state, desk] = await Promise.all([getPageBody("safety"), getDesk()]);
  const page = resolvePage(state, PAGE_BODIES.safety);

  return (
    <>
      {page.faq.length > 0 && <JsonLd data={faqPageSchema(page.faq)} />}

      <PageHero
        eyebrow={page.eyebrow ?? "Trust & Safety"}
        title={page.title}
        description={page.description}
        meta={page.meta}
        actions={
          <>
            <ButtonLink href={desk.tel} variant="gradient-primary" size="lg" shine leftIcon={<Phone size={16} />}>
              Call the desk
            </ButtonLink>
            <ButtonLink href="/track" variant="outline" size="lg">
              Track a booking
            </ButtonLink>
          </>
        }
      />

      <SafetyPillars />

      <TrackStatusLegend bg="white" pad="tight" />

      <ProseBand
        sections={page.sections}
        eyebrow="The detail"
        title="How each of those works"
        bg="muted"
        source={sourceNote(page.source)}
        footer={
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-ink-4">Related</span>
            {[
              { href: "/support", label: "Support channels" },
              { href: "/refund", label: "Cancellation & refunds" },
              { href: "/security", label: "Account security" },
              { href: "/track", label: "Track a booking" },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-xs font-extrabold text-primary-700 transition-colors hover:text-primary-800"
              >
                {l.label}
              </a>
            ))}
          </div>
        }
      />

      <EmergencyBand />

      {page.faq.length > 0 && (
        <PageFaq
          faqs={page.faq}
          eyebrow="Safety questions"
          title="What people ask before they travel"
          pad="tight"
          overlay="dots-faint"
        />
      )}

      <CtaSection
        variant={{
          headline: "Book with the checks already done",
          subtitle:
            "Verified partners, upfront fares and a desk you can actually reach — cabs, stays and tours on one platform.",
          cta_text: "Book a cab",
          cta_link: "/cabs",
        }}
        bg={page.faq.length > 0 ? "white" : "muted"}
        pad="tight"
        cardSize="compact"
        secondary={{ label: "Talk to the desk", href: "/support" }}
      />
    </>
  );
}
