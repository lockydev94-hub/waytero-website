/**
 * PressSection — building blocks for the /press page.
 * Each export is a self-contained section; the page composes them.
 */

import { Newspaper, Megaphone, Download, ExternalLink, Calendar, Tag } from "lucide-react";
import { Container, Section, PageHeader, SectionHeader, IconBox, Card, ButtonLink, Badge, MotionGlow } from "@/components/ui";
import { MotionStagger, MotionStaggerItem } from "@/components/ui";

// ── Hero ────────────────────────────────────────────────────────────────
export function PressHero() {
  return (
    <Section bg="white" pad="lg" className="bg-gradient-to-br from-accent-50/60 via-white to-primary-50/40 relative overflow-hidden" overlay="dots">
      <div aria-hidden className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-accent-100/40 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-primary-100/40 blur-3xl" />
      <Container size="lg" className="relative">
        <PageHeader
          eyebrow="Press & Media"
          title={
            <>
              WayTero in <span className="text-gradient-primary">the news</span>
            </>
          }
          subtitle="India's travel operating system — stories, announcements, and resources for journalists covering the travel-tech landscape."
        />
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <ButtonLink href="mailto:press@waytero.com" variant="gradient-primary" size="lg" shine leftIcon={<Megaphone size={16} />}>
            Press enquiries
          </ButtonLink>
          <ButtonLink href="/contact" variant="outline" size="lg">Contact us</ButtonLink>
        </div>
      </Container>
    </Section>
  );
}

// ── Press releases ──────────────────────────────────────────────────────
const RELEASES = [
  {
    date: "2026-08-01",
    tag: "Product",
    title: "WayTero launches hotel booking across 30+ Indian cities",
    excerpt: "The customer website now lets travelers search hotels by city or landmark, compare rates plan-by-plan, and complete bookings end-to-end — powered by WayTero's real-time inventory and GST-compliant pricing engine.",
  },
  {
    date: "2026-06-18",
    tag: "Funding",
    title: "WayTero crosses 1,200 partner properties and 800 verified drivers",
    excerpt: "Two years after launch, the platform's partner network spans hotels, cab operators, and tour companies in 30+ cities with instant payouts and a single travel wallet.",
  },
  {
    date: "2026-04-09",
    tag: "Product",
    title: "Travel Wallet goes live with instant refunds",
    excerpt: "Cancellations now credit straight to the customer's WayTero wallet in real time — no 5-7 day card reversal wait.",
  },
  {
    date: "2026-01-15",
    tag: "Company",
    title: "WayTero named among India's emerging travel-tech startups",
    excerpt: "Industry watchers spotlight the platform's unified operating system approach to cabs, hotels, tours, and partner settlements.",
  },
];

export function PressReleaseList() {
  return (
    <Section bg="white" pad="lg" overlay="dots">
      <Container size="lg">
        <SectionHeader
          eyebrow="Latest updates"
          title="Press releases"
          subtitle="Recent announcements from the WayTero team."
          accent="primary"
          underline
          animatedEyebrow
        />
        <MotionStagger className="mt-10 space-y-4">
          {RELEASES.map((r) => (
            <MotionStaggerItem key={r.title}>
              <MotionGlow color="primary" intensity={0.15} size={300} className="rounded-2xl">
                <Card variant="premium" hover lift="sm" hoverTint="primary" className="group p-6">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-ink-4 mb-2">
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={12} /> {r.date}
                    </span>
                    <Badge tone="accent">{r.tag}</Badge>
                  </div>
                  <h3 className="text-lg font-bold text-ink group-hover:text-primary-700 transition-colors">{r.title}</h3>
                  <p className="mt-2 text-sm text-ink-3 leading-relaxed">{r.excerpt}</p>
                  <button type="button" className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-primary-600 hover:text-primary-700 group/btn">
                    Read release
                    <ExternalLink size={13} className="transition-transform group-hover/btn:translate-x-0.5" />
                  </button>
                </Card>
              </MotionGlow>
            </MotionStaggerItem>
          ))}
        </MotionStagger>
      </Container>
    </Section>
  );
}

// ── Media kit ───────────────────────────────────────────────────────────
export function MediaKitBand() {
  return (
    <Section bg="muted" pad="lg" overlay="grid">
      <Container size="lg">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <Card variant="premium" hover lift="md" className="group p-8 flex flex-col">
            <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="mb-4">
              <IconBox icon={<Newspaper />} tone="primary" size="lg" gradient glow className="group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300" />
            </div>
            <h3 className="text-xl font-bold text-ink mb-2 group-hover:text-primary-700 transition-colors">Media kit</h3>
            <p className="text-sm text-ink-3 mb-6">
              Logos, brand guidelines, product screenshots, and founder photos — everything a journalist needs, in one zip.
            </p>
            <div className="mt-auto">
              <ButtonLink href="mailto:press@waytero.com" variant="gradient-primary" size="md" fullWidth shine leftIcon={<Download size={15} />}>
                Download media kit
              </ButtonLink>
            </div>
          </Card>
          <Card variant="premium" hover lift="md" className="group p-8 flex flex-col">
            <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-500/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="mb-4">
              <IconBox icon={<Tag />} tone="accent" size="lg" gradient glow className="group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300" />
            </div>
            <h3 className="text-xl font-bold text-ink mb-2 group-hover:text-accent-700 transition-colors">Media enquiries</h3>
            <p className="text-sm text-ink-3 mb-6">
              For interviews, data, or fact-checking, our press team responds within one business day.
            </p>
            <div className="mt-auto space-y-2 text-sm text-ink-2">
              <div className="font-bold text-ink">press@waytero.com</div>
              <div className="text-ink-3">+91 90000 00001 (press line)</div>
            </div>
          </Card>
        </div>
      </Container>
    </Section>
  );
}
