import Link from "next/link";
import { Container, Section, SectionHeader } from "@/components/ui";
import type { BandTone } from "@/types/cms";
import { getAvailability, hiddenServices, isHiddenHref, SERVICE_PATHS, type ServiceKey } from "@/lib/availability";
import { getTripLinks } from "@/lib/cabTrips";
import { getLandingRefs, landingUrl, type LandingRef } from "@/lib/landingIndex";

/* ============================================================
   SitemapIndex — every page a visitor can actually reach.

   Three things make this more than a list of links:
   • a vertical with no supply is dropped here as it is 404ed site-wide,
     so the page never offers a dead door;
   • place and route pages come from the live landing index, so a page the
     admin publishes appears here without a deploy;
   • nothing points at /offers — there is no offers index route, only the
     individual /offers/{slug} pages the homepage links.

   Account pages (/bookings, /wallet, /profile) are deliberately absent:
   they are behind a sign-in, so a link here would only ever land a visitor
   on the login screen. They stay out of sitemap.xml for the same reason.
   ============================================================ */

interface SitemapLink {
  href: string;
  label: string;
}

const BOOKING_LINKS: Record<"HOTEL" | "TOUR", SitemapLink[]> = {
  HOTEL: [
    { href: "/hotels", label: "Search hotels" },
    { href: "/hotels/results", label: "Browse every stay" },
  ],
  TOUR: [{ href: "/tours", label: "Tour packages" }],
};

const ACCOUNT: SitemapLink[] = [
  { href: "/login", label: "Sign in" },
  { href: "/register", label: "Create an account" },
  { href: "/track", label: "Track a booking" },
  { href: "/feedback", label: "Rate a completed trip" },
  { href: "/account-deletion", label: "Delete an account" },
];

const SUPPORT: SitemapLink[] = [
  { href: "/support", label: "Support centre" },
  { href: "/contact", label: "Contact the desk" },
  { href: "/safety", label: "Safety" },
  { href: "/security", label: "Security" },
];

const COMPANY: SitemapLink[] = [
  { href: "/about", label: "About WayTero" },
  { href: "/blog", label: "Travel journal" },
  { href: "/partner", label: "Become a partner" },
  { href: "/careers", label: "Careers" },
  { href: "/press", label: "Press & media" },
];

const POLICY: SitemapLink[] = [
  { href: "/booking-instructions", label: "Booking instructions" },
  { href: "/refund", label: "Refund & cancellation policy" },
  { href: "/terms", label: "Terms of service" },
  { href: "/privacy", label: "Privacy policy" },
  { href: "/cookies", label: "Cookies & browser storage" },
];

/** How the landing engine's page types read to a visitor. */
const LANDING_GROUP: Record<string, string> = {
  CITY_HUB: "Cities",
  CITY_CABS: "Cabs by city",
  CITY_HOTELS: "Hotels by city",
  CITY_TOURS: "Tours by city",
  STATE_HOTELS: "Hotels by state",
  STATE_TOURS: "Tours by state",
  PLACE_CABS: "Cabs from a place",
};

const PER_GROUP_CAP = 8;

function LandingGroup({ title, refs }: { title: string; refs: LandingRef[] }) {
  const shown = refs.slice(0, PER_GROUP_CAP);
  const rest = refs.length - shown.length;
  return (
    <div>
      <h3 className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-ink-4">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm">
        {shown.map((ref) => (
          <li key={ref.slug}>
            <Link
              href={landingUrl(ref.slug)}
              className="font-semibold text-ink-2 transition-colors hover:text-primary-700"
            >
              {ref.scope.display_name}
            </Link>
          </li>
        ))}
      </ul>
      {rest > 0 && (
        <p className="mt-3 text-xs text-ink-4">
          +{rest} more {title.toLowerCase()} page{rest === 1 ? "" : "s"}, linked from the homepage
          and from every booking search.
        </p>
      )}
    </div>
  );
}

function LinkGroup({ title, links }: { title: string; links: SitemapLink[] }) {
  return (
    <div>
      <h3 className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-ink-4">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="font-semibold text-ink-2 transition-colors hover:text-primary-700"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function SitemapIndex({
  bg = "muted",
  pad = "tight",
}: {
  bg?: BandTone;
  pad?: "tight" | "sm" | "md";
}) {
  const [av, refs, trips] = await Promise.all([
    getAvailability(),
    getLandingRefs(),
    getTripLinks(),
  ]);
  const hidden = hiddenServices(av);

  // Cab is vertical-first: the index, then one link per trip type the fare
  // engine still prices (a type with no active rule 404s, so it gets no link
  // either), then the corridor index.
  const cabLinks: SitemapLink[] = [
    { href: "/cabs", label: "All cab bookings" },
    ...trips,
    { href: "/cabs/routes", label: "Route fare index" },
  ];

  const book: SitemapLink[] = [];
  for (const key of ["CAB", "HOTEL", "TOUR"] as ServiceKey[]) {
    if (!isHiddenHref(SERVICE_PATHS[key], hidden)) {
      book.push(...(key === "CAB" ? cabLinks : BOOKING_LINKS[key]));
    }
  }

  const panel = bg === "white" ? "border-ink-7 bg-ink-9/60" : "border-ink-7 bg-white";

  // Landing pages are the only group that can be empty, and a heading over
  // nothing is not a group. The two biggest families are shown in full-ish;
  // the rest are reachable from the homepage and from a search.
  const landingGroups = Object.entries(LANDING_GROUP)
    .map(([type, title]) => ({
      type,
      title,
      refs: refs.filter((r) => r.page_type === type && !isHiddenHref(r.canonical_path, hidden)),
    }))
    .filter((g) => g.refs.length > 0)
    .sort((a, b) => b.refs.length - a.refs.length)
    .slice(0, 2);

  return (
    <Section bg={bg} pad={pad} id="pages">
      <Container size="lg">
        <SectionHeader
          eyebrow="The whole site"
          title="Sitemap"
          subtitle="Every page a visitor can reach, with the verticals that have no live supply left out — the same rule that takes those pages down everywhere else."
          accent="primary"
          underline
          animatedEyebrow
          scale="home"
        />

        <div className={`mt-6 grid grid-cols-1 gap-x-8 gap-y-8 rounded-3xl border p-6 sm:p-8 sm:grid-cols-2 lg:grid-cols-3 ${panel}`}>
          <LinkGroup title="Book" links={book} />
          <LinkGroup title="Support & safety" links={SUPPORT} />
          <LinkGroup title="Your account" links={ACCOUNT} />
          <LinkGroup title="Company" links={COMPANY} />
          <LinkGroup title="Policies" links={POLICY} />
          {landingGroups.map((g) => (
            <LandingGroup key={g.type} title={g.title} refs={g.refs} />
          ))}
        </div>
      </Container>
    </Section>
  );
}
