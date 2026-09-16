import Link from "next/link";
import { MapPin, Clock, ImageOff } from "lucide-react";
import { Container, Section, SectionHeader, MotionGlow, MotionTilt } from "@/components/ui";
import { MotionStagger, MotionStaggerItem } from "@/components/ui";
import { pick } from "@/types/cms";

interface PopularDestinationsSectionProps {
  variant: Record<string, unknown>;
}

/** Row shape returned by GET /public/tours/popular-destinations. */
interface Destination {
  city_id: number;
  /** API field is `name` (older code expected city_name — that mismatch made
   *  links render as /tours?destination=undefined). */
  name?: string;
  city_name?: string;
  state_name?: string | null;
  package_count: number;
  image_url?: string | null;
  hero_image_url?: string | null;
}

const TOUR_API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

/**
 * PopularDestinationsSection — homepage destinations grid.
 *
 * DB-driven: only cities that actually have active tour packages
 * (GET /public/tours/popular-destinations). Cards with a package image show
 * it; cities without an image render as a clean text-first card — never a
 * dark empty void. Links go to the tours listing pre-filtered by the
 * destination name, which always renders real results.
 */
export default async function PopularDestinationsSection({ variant }: PopularDestinationsSectionProps) {
  const eyebrow = pick<string>(variant, "variant_tag", pick<string>(variant, "eyebrow", "Where to next"));
  const title = pick<string>(variant, "headline", pick<string>(variant, "title", "Popular Destinations"));
  const subtitle = pick<string>(variant, "subheadline", pick<string>(variant, "subtitle", "Trending spots this season — handpicked for every kind of traveler."));

  let destinations: Destination[] = [];
  try {
    const res = await fetch(`${TOUR_API_BASE}/public/tours/popular-destinations`, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const data = await res.json();
      const raw = Array.isArray(data) ? data : (data.items ?? []);
      destinations = raw as Destination[];
    }
  } catch {
    destinations = [];
  }

  // Empty catalogue → Coming Soon (no fake destinations, ever).
  if (destinations.length === 0) {
    return (
      <Section bg="white" pad="lg" id="destinations" overlay="dots">
        <Container size="lg">
          <SectionHeader
            eyebrow={eyebrow}
            title={title}
            subtitle={subtitle}
            accent="primary"
            underline
            animatedEyebrow
          />
          <div className="relative overflow-hidden rounded-3xl border border-ink-7 bg-white p-10 text-center shadow-wt-sm">
            <div aria-hidden className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-primary-500/10 blur-3xl" />
            <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-accent-500/10 blur-3xl" />
            <div className="relative">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-500/10 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-accent-600">
                <Clock className="h-3.5 w-3.5" /> Coming soon
              </span>
              <h3 className="mt-5 text-2xl font-extrabold tracking-tight text-ink">
                Tour destinations are coming soon
              </h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-3">
                Our verified operators are adding destinations right now. Once
                tour packages go live, you'll find them here.
              </p>
            </div>
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <Section bg="white" pad="lg" id="destinations" overlay="dots">
      <Container size="lg">
        <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} accent="primary" underline animatedEyebrow />
        <MotionStagger className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {destinations.slice(0, 8).map((d) => {
            const name = d.name ?? d.city_name ?? "";
            if (!name) return null;
            const image = d.image_url ?? d.hero_image_url ?? null;
            const href = `/destinations/${name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`;
            return (
              <MotionStaggerItem key={d.city_id} className="h-full">
                <MotionGlow color="primary" intensity={0.2} size={240} className="h-full rounded-2xl">
                  <MotionTilt max={3} className="h-full">
                    <Link
                      href={href}
                      className="group relative block h-full aspect-[4/5] rounded-2xl overflow-hidden border border-ink-7 hover:border-primary-300 hover:shadow-wt-xl transition-all duration-500 ease-[var(--ease-wt)]"
                    >
                      {image ? (
                        <>
                          {/* ── With image: photo card ── */}
                          <div
                            aria-hidden
                            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                            style={{ backgroundImage: `url(${image})` }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-ink-900/85 via-ink-900/25 to-transparent" />
                          <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <div className="absolute top-3 right-3 z-10 inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur text-primary-700">
                            {d.package_count} tour{d.package_count === 1 ? "" : "s"}
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                            <div className="text-xs text-white/70 mb-1 inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> Odisha, India
                            </div>
                            <h3 className="text-lg font-bold group-hover:text-accent-200 transition-colors">{name}</h3>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* ── No image: clean text-first card (no void, no
                              fake "From ₹" or "India" filler) ── */}
                          <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-50 transition-transform duration-700 group-hover:scale-[1.03]" />
                          <div aria-hidden className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary-500/10 blur-2xl transition-opacity duration-500 group-hover:opacity-150" />
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 text-white shadow-wt-primary transition-transform duration-500 group-hover:scale-110">
                              <MapPin className="h-5 w-5" />
                            </span>
                            <h3 className="mt-3 text-lg font-extrabold tracking-tight text-ink group-hover:text-primary-700 transition-colors">
                              {name}
                            </h3>
                            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary-600/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-700">
                              {d.package_count} tour{d.package_count === 1 ? "" : "s"}
                            </span>
                          </div>
                          {/* Hairline accent that lights on hover */}
                          <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </>
                      )}
                    </Link>
                  </MotionTilt>
                </MotionGlow>
              </MotionStaggerItem>
            );
          })}
        </MotionStagger>
      </Container>
    </Section>
  );
}
