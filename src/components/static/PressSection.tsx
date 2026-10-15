/**
 * PressSection — building blocks for the /press page.
 * Each export is a self-contained section; the page composes them.
 * Contact values come from the DB (system_configurations via
 * /public/platform-profile); the owner-approved brand master is the
 * fallback. No invented press emails, phone lines, or "media kit zips".
 */

import { Newspaper, Megaphone, Mail, Tag } from "lucide-react";
import { Container, Section, PageHeader, IconBox, Card, ButtonLink } from "@/components/ui";
import publicCmsService from "@/services/publicCms";
import { displayPhone, telHref } from "@/lib/supportPhone";

// ── Hero ────────────────────────────────────────────────────────────────
export async function PressHero() {
  const profile = await publicCmsService.getPlatformProfile();
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
          subtitle="WayTero's travel platform — stories, announcements, and resources for journalists covering the travel-tech landscape."
        />
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <ButtonLink href={`mailto:${profile.support_email}`} variant="gradient-primary" size="lg" shine leftIcon={<Megaphone size={16} />}>
            Press enquiries
          </ButtonLink>
          <ButtonLink href="/contact" variant="outline" size="lg">Contact us</ButtonLink>
        </div>
      </Container>
    </Section>
  );
}

// ── Press releases ──────────────────────────────────────────────────────
// Removed 2026-10-15: the seeded releases were invented milestones
// (fake funding/awards numbers). Real announcements should ship from the
// CMS/blog when they exist — the site never fabricates press coverage.

// ── Media kit ───────────────────────────────────────────────────────────
export async function MediaKitBand() {
  const profile = await publicCmsService.getPlatformProfile();
  return (
    <Section bg="muted" pad="lg" overlay="grid">
      <Container size="lg">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <Card variant="premium" hover lift="md" className="group p-8 flex flex-col">
            <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="mb-4">
              <IconBox icon={<Newspaper />} tone="primary" size="lg" gradient glow className="group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300" />
            </div>
            <h3 className="text-xl font-bold text-ink mb-2 group-hover:text-primary-700 transition-colors">Media assets</h3>
            <p className="text-sm text-ink-3 mb-6">
              Logos, brand guidelines, product screenshots, and founder photos — email us and we&apos;ll share the latest set.
            </p>
            <div className="mt-auto">
              <ButtonLink href={`mailto:${profile.support_email}?subject=Media%20kit%20request`} variant="gradient-primary" size="md" fullWidth shine leftIcon={<Mail size={15} />}>
                Request media assets
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
              For interviews, data, or fact-checking, write to our team — we pick press requests up alongside support.
            </p>
            <div className="mt-auto space-y-2 text-sm text-ink-2">
              <div className="font-bold text-ink">{profile.support_email}</div>
              <a href={telHref(profile.support_phone)} className="block text-ink-3 hover:text-primary-700 transition-colors">
                {displayPhone(profile.support_phone)}
              </a>
            </div>
          </Card>
        </div>
      </Container>
    </Section>
  );
}
