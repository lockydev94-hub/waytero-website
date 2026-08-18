/**
 * SitemapSection — building blocks for the /sitemap page.
 * Each export is a self-contained section; the page composes them.
 */

import { Container, Section, PageHeader, SectionHeader, Card, MotionStagger, MotionStaggerItem } from "@/components/ui";

// ── Hero ────────────────────────────────────────────────────────────────
export function SitemapHero() {
  return (
    <Section bg="white" pad="lg" className="bg-gradient-to-br from-primary-50/60 via-white to-accent-50/40 relative overflow-hidden" overlay="dots">
      <div aria-hidden className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary-100/40 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-accent-100/40 blur-3xl" />
      <Container size="lg" className="relative">
        <PageHeader
          eyebrow="Sitemap"
          title={
            <>Every page on <span className="text-gradient-primary">WayTero</span></>
          }
          subtitle="Everything in one place — services, account tools, company info, and legal pages."
        />
      </Container>
    </Section>
  );
}

interface SitemapLink {
  label: string;
  href: string;
}

interface SitemapGroup {
  title: string;
  links: SitemapLink[];
}

const GROUPS: SitemapGroup[] = [
  {
    title: "Book a trip",
    links: [
      { label: "Cabs", href: "/cabs" },
      { label: "Hotels", href: "/hotels" },
      { label: "Tours & packages", href: "/tours" },
      { label: "Track your trip", href: "/track" },
    ],
  },
  {
    title: "My account",
    links: [
      { label: "My Bookings", href: "/bookings" },
      { label: "My Wallet", href: "/wallet" },
      { label: "My Profile", href: "/profile" },
      { label: "Login", href: "/login" },
      { label: "Register", href: "/register" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Press & Media", href: "/press" },
      { label: "Travel Blog", href: "/blog" },
      { label: "Become a Partner", href: "/partner" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "/support" },
      { label: "Contact Us", href: "/contact" },
      { label: "Safety", href: "/safety" },
      { label: "Cancellation & Refunds", href: "/refund" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Refund Policy", href: "/refund" },
      { label: "Cookies", href: "/cookies" },
      { label: "Security", href: "/security" },
    ],
  },
];

// ── Grouped links ───────────────────────────────────────────────────────
export function SitemapGroups() {
  return (
    <Section bg="grid" pad="lg">
      <Container size="lg">
        <MotionStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {GROUPS.map((g) => (
            <MotionStaggerItem key={g.title} className="h-full">
              <Card variant="premium" hover lift="sm" className="group h-full overflow-hidden">
                {/* Gradient accent bar */}
                <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500" />
                <div className="flex items-center gap-2 mb-4">
                  <span className="h-1 w-8 rounded-full bg-gradient-to-r from-primary-500 to-accent-500" aria-hidden />
                  <h3 className="text-base font-extrabold text-ink uppercase tracking-wider">{g.title}</h3>
                </div>
                <ul className="space-y-2.5">
                  {g.links.map((l) => (
                    <li key={l.href}>
                      <a
                        href={l.href}
                        className="group/link inline-flex items-center gap-2 text-sm font-semibold text-ink-2 hover:text-primary-600 transition-colors"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-accent-400 group-hover/link:bg-primary-600 group-hover/link:scale-125 transition-all" />
                        {l.label}
                        <span className="opacity-0 group-hover/link:opacity-100 -translate-x-1 group-hover/link:translate-x-0 transition-all text-primary-500">→</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </Card>
            </MotionStaggerItem>
          ))}
        </MotionStagger>
      </Container>
    </Section>
  );
}
