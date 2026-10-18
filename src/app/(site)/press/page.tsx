import { Download, Mail, Newspaper, Megaphone } from "lucide-react";
import {
  Container, Section, SectionHeader, Card, IconBox, ButtonLink,
} from "@/components/ui";
import PageHero from "@/components/sections/PageHero";
import ProseBand from "@/components/sections/ProseBand";
import LandingStatsStrip from "@/components/landing/LandingStatsStrip";
import JsonLd from "@/components/sections/JsonLd";
import { getPageBody, resolvePage, sourceNote } from "@/lib/pageBody";
import { getDesk } from "@/lib/desk";
import { PAGE_BODIES } from "@/content/pageBodies";
import publicCmsService from "@/services/publicCms";
import type { LandingStat } from "@/lib/landingIndex";
import type { BandTone } from "@/types/cms";
import { pageMetadata, type SeoContent } from "@/services/seoService";

const META_FALLBACK: SeoContent = {
  title: "Press & Media — WayTero",
  description:
    "What WayTero will give a journalist: live platform figures, brand assets, and the address to ask from.",
  keywords: ["WayTero press", "travel tech India media", "travel platform newsroom"],
};

export async function generateMetadata(): Promise<import("next").Metadata> {
  return pageMetadata("press", "/press", META_FALLBACK);
}

/* ============================================================
   /press — a page that can only promise what the database can show.

   The version it replaces carried invented milestone press releases. There is
   no announcements table, so nothing is announced here; instead the numbers a
   journalist can quote are read live from the same counts the homepage bands
   render, and a figure that is zero is not printed at all.
   ============================================================ */

export default async function PressPage() {
  const [state, counts, desk, cms] = await Promise.all([
    getPageBody("press"),
    publicCmsService.getHomepageBandCounts(),
    getDesk(),
    publicCmsService.getHomepage(),
  ]);
  const page = resolvePage(state, PAGE_BODIES.press);

  // Every stat is a row count from the booking tables. A zero means the band
  // renders nothing, and a null payload (API unreachable) means the whole band
  // is dropped — a press page printing a stale number is worse than one
  // printing nothing.
  const stats: LandingStat[] = [];
  if (counts) {
    const cities = counts.POPULAR_CITIES ?? 0;
    const routes = counts.POPULAR_ROUTES ?? 0;
    const hotels = counts.FEATURED_HOTELS ?? 0;
    const tours = counts.TOUR_PACKAGES ?? 0;
    const posts = counts.BLOG ?? 0;
    if (cities > 0) stats.push({ value: cities, label: "cities with live cab fares" });
    if (routes > 0) stats.push({ value: routes, label: "routes with a set fare" });
    if (hotels > 0) stats.push({ value: hotels, label: "properties bookable today" });
    if (tours > 0) stats.push({ value: tours, label: "tour packages live" });
    if (posts > 0) stats.push({ value: posts, label: "journal entries published" });
  }

  // Only a real URL becomes a downloadable asset. The logo is the one asset the
  // platform definitely has; screenshots and team background are sent on reply.
  const logoUrl = cms?.header?.logo_url?.trim() || "";

  // Light bands alternate white / off-white. A band that renders nothing must
  // not consume a tone, or two of the same end up side by side.
  const shown: string[] = [];
  if (stats.length > 0) shown.push("stats");
  if (page.sections.length > 0) shown.push("prose");
  if (logoUrl) shown.push("assets");
  shown.push("close");
  const tone = Object.fromEntries(
    shown.map((k, i) => [k, i % 2 === 0 ? "muted" : "white"]),
  ) as Record<string, BandTone>;

  return (
    <>
      {page.description && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "WayTero",
            description: page.description,
            email: desk.email,
          }}
        />
      )}

      <PageHero
        eyebrow={page.eyebrow ?? "For journalists"}
        title={page.title}
        accent="Media"
        description={page.description}
        meta={page.meta}
        actions={
          <>
            <ButtonLink
              href={`mailto:${desk.email}?subject=Press%20enquiry`}
              variant="gradient-primary"
              size="lg"
              shine
              leftIcon={<Megaphone size={16} />}
            >
              Email an enquiry
            </ButtonLink>
            <ButtonLink href="/about" variant="outline" size="lg">
              About WayTero
            </ButtonLink>
          </>
        }
      />

      {stats.length > 0 && (
        <LandingStatsStrip
          stats={stats}
          title="Live on the platform today"
          bg={tone.stats}
          pad="tight"
        />
      )}

      <ProseBand
        sections={page.sections}
        eyebrow="What you can quote"
        title="The honest brief"
        bg={tone.prose}
        overlay="dots-faint"
        source={sourceNote(page.source)}
        footer={
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-ink-4">Elsewhere</span>
            {[
              { href: "/about", label: "About the platform" },
              { href: "/blog", label: "The travel journal" },
              { href: "/sitemap", label: "Everything on this site" },
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

      {logoUrl && (
        <Section bg={tone.assets} pad="tight" id="assets">
          <Container size="lg">
            <SectionHeader
              eyebrow="Brand assets"
              title="The wordmark, as it is today"
              accent="primary"
              underline
              animatedEyebrow
              scale="home"
            />
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Card variant="premium" className="p-7 flex flex-col items-start">
                <IconBox icon={<Download />} tone="accent" size="md" gradient glow className="mb-4" />
                <h3 className="font-bold text-ink mb-1.5">WayTero logo</h3>
                <p className="text-sm text-ink-3 leading-relaxed mb-5">
                  The file the site uses right now, straight from the platform&rsquo;s own asset
                  storage — so the wordmark you print is the one we are using.
                </p>
                <div className="mt-auto">
                  <a
                    href={logoUrl}
                    className="inline-flex items-center gap-2 rounded-xl border border-ink-7 bg-white px-5 py-3 text-sm font-bold text-ink-2 transition-colors hover:border-primary-300 hover:text-primary-700"
                  >
                    <Download className="h-4 w-4" aria-hidden />
                    Open the logo file
                  </a>
                </div>
              </Card>
              <Card variant="premium" className="p-7 flex flex-col items-start">
                <IconBox icon={<Newspaper />} tone="primary" size="md" gradient glow className="mb-4" />
                <h3 className="font-bold text-ink mb-1.5">Screenshots and the team</h3>
                <p className="text-sm text-ink-3 leading-relaxed mb-5">
                  Product screens, and the background of the people who run the platform, go out by
                  reply — they change too often to be parked in a download.
                </p>
                <div className="mt-auto">
                  <ButtonLink
                    href={`mailto:${desk.email}?subject=Media%20assets%20request`}
                    variant="outline"
                    size="md"
                    leftIcon={<Mail size={15} />}
                  >
                    Ask for them
                  </ButtonLink>
                </div>
              </Card>
            </div>
          </Container>
        </Section>
      )}

      {/* The closing band is the action: a press page ends with an address, not
          a booking CTA. */}
      <Section bg={tone.close} pad="tight" id="enquiries" overlay="grid-faint">
        <Container size="lg">
          <div className="rounded-3xl border border-ink-7 bg-gradient-to-br from-ink via-ink-800 to-primary-900 text-white px-7 py-8 lg:px-10 lg:py-10 relative overflow-hidden">
            <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-accent-500/25 blur-3xl" />
            <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-center">
              <div>
                <h2 className="text-xl lg:text-2xl font-extrabold tracking-tight">
                  Write to us with the deadline
                </h2>
                <p className="mt-1.5 text-sm text-white/75 max-w-xl leading-relaxed">
                  Tell us the outlet, the deadline and the specific question. Aggregate figures with
                  a date on them and someone to speak to are available; customer names, driver names
                  and per-partner earnings are not.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href={`mailto:${desk.email}?subject=Press%20enquiry`}
                  className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-accent-500 hover:bg-accent-600 text-white font-bold transition-all duration-300 hover:-translate-y-0.5 shadow-wt-accent"
                >
                  <Mail className="h-4 w-4" aria-hidden />
                  {desk.email}
                </a>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
