import Link from "next/link";
import { Hotel, MapPin, Car, Clock, ArrowRight } from "lucide-react";
import { Container, Section } from "@/components/ui";

/**
 * ComingSoon — honest empty-catalogue state.
 *
 * Shown wherever the website would list hotels/tours/cabs but the database
 * has no active rows yet. Replaces the old hardcoded placeholder cards
 * (fake Taj/Leela hotels, fake Kerala/Rajasthan tours): nothing is shown
 * to customers that admin or partners haven't actually added. As soon as
 * the admin/partners add real data, the sections render it instead of
 * this state — no code change needed.
 */

type Service = "hotels" | "tours" | "cabs";

const COPY: Record<
  Service,
  { title: string; line: string; Icon: typeof Hotel }
> = {
  hotels: {
    title: "Hotel bookings are coming soon",
    line: "Our team is onboarding verified hotels right now. Once partners add their properties, you'll be able to book them here directly.",
    Icon: Hotel,
  },
  tours: {
    title: "Tour packages are coming soon",
    line: "Curated tour packages are being added by our verified operators. Check back shortly — your next trip is being planned.",
    Icon: MapPin,
  },
  cabs: {
    title: "Cab booking is coming soon",
    line: "We're verifying partners and drivers in your city. Cab booking will open as soon as the first fleets go live.",
    Icon: Car,
  },
};

export default function ComingSoon({
  service,
  eyebrow,
  title,
  headline,
  compact = false,
}: {
  service: Service;
  eyebrow?: string;
  title?: string;
  headline?: string;
  /** compact = inline panel (inside a page with its own hero); full = standalone section */
  compact?: boolean;
}) {
  const copy = COPY[service];
  const Icon = copy.Icon;
  const displayTitle = title ?? copy.title;

  const panel = (
    <div className="relative overflow-hidden rounded-3xl border border-ink-7 bg-white p-10 text-center shadow-wt-sm">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-primary-500/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-accent-500/10 blur-3xl"
      />
      <div className="relative">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-500/10 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-accent-600">
          <Clock className="h-3.5 w-3.5" /> Coming soon
        </span>
        <div className="mx-auto mt-6 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 text-white shadow-wt-primary">
          <Icon className="h-7 w-7" />
        </div>
        <h3 className="mt-5 text-2xl font-extrabold tracking-tight text-ink">
          {displayTitle}
        </h3>
        {headline && (
          <p className="mt-2 text-sm font-semibold text-primary-700">{headline}</p>
        )}
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-3">
          {copy.line}
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 px-6 py-3 text-sm font-bold text-white shadow-wt-primary transition-all hover:-translate-y-0.5 hover:shadow-wt-glow-primary"
        >
          Explore WayTero <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );

  if (compact) {
    return <div className="my-8">{panel}</div>;
  }

  return (
    <Section bg="muted" pad="lg" overlay="dots">
      <Container size="lg">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          {eyebrow && (
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-primary-600">
              {eyebrow}
            </p>
          )}
          <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            {headline ?? displayTitle}
          </h2>
        </div>
        {panel}
      </Container>
    </Section>
  );
}
