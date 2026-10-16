import Link from "next/link";
import Image from "next/image";
import { Clock, MapPin, ChevronRight, ArrowRight } from "lucide-react";
import { Container, Section, SectionHeader, MotionTilt, MotionGlow, Carousel } from "@/components/ui";
import { MotionStaggerItem } from "@/components/ui";
import { pick } from "@/types/cms";
import type { PublicTourPackage } from "@/services/tourService";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

/** Tints layered over the photo: dark at the bottom so the copy stays
 *  legible, coloured through the middle. Colour only — no claim about the
 *  package lives in here. */
const OVERLAYS = [
  "from-primary-900/92 via-primary-700/35 to-transparent",
  "from-accent-900/92 via-accent-700/35 to-transparent",
  "from-ink-900/92 via-sky-800/35 to-transparent",
  "from-ink-900/92 via-emerald-800/35 to-transparent",
  "from-ink-900/92 via-rose-800/35 to-transparent",
  "from-ink-900/92 via-indigo-800/35 to-transparent",
];

interface TourPackagesSectionProps {
  variant: Record<string, unknown>;
}

/**
 * TourPackagesSection — homepage tours strip.
 *
 * Fully DB-driven: shows only tour packages that admin/partners actually
 * added (GET /public/tours/packages). No hardcoded placeholder tours —
 * when the catalogue is empty the whole section becomes an honest
 * "Coming soon" state. The first added package renders automatically.
 */
export default async function TourPackagesSection({ variant }: TourPackagesSectionProps) {
  const eyebrow = pick<string>(variant, "variant_tag", pick<string>(variant, "eyebrow", "Curated experiences"));
  const title = pick<string>(variant, "headline", pick<string>(variant, "title", "Tour Packages Loved by Travelers"));
  const subtitle = pick<string>(variant, "subheadline", pick<string>(variant, "subtitle", "Handpicked itineraries with verified partners — fully managed from booking to return."));

  let tours: PublicTourPackage[] = [];
  try {
    // Raw fetch (not tourService) — this runs on the server and the axios
    // client is browser-only; revalidate keeps the homepage ISR-cacheable.
    const res = await fetch(`${API_BASE}/public/tours/packages?page=1&page_size=6`, {
      next: { revalidate: 120 },
    });
    if (res.ok) {
      const data = (await res.json()) as { items?: PublicTourPackage[] };
      tours = data.items ?? [];
    }
  } catch {
    tours = [];
  }

  // Empty catalogue → omit the section entirely (owner rule: no
  // "coming soon" fakery for a vertical with no real supply).
  if (tours.length === 0) return null;

  return (
    <Section bg="muted" pad="home" id="tours" overlay="dots-faint">
      <Container size="lg">
        <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} accent="primary" underline animatedEyebrow scale="home" />
        {/* Photo-first cards: the image is the card, the copy sits on a
            gradient so nothing is invented and nothing hides behind a
            placeholder price. */}
        <Carousel ariaLabel="Tour packages">
          {tours.map((t, i) => (
            <MotionStaggerItem
              key={t.id}
              className="h-full w-[86%] min-w-[290px] max-w-[620px] shrink-0 grow snap-start sm:w-[310px]"
            >
              <MotionGlow color="primary" intensity={0.2} size={320} className="h-full rounded-3xl">
                <MotionTilt max={3} className="h-full">
                  <Link
                    href={`/tours/${t.slug}`}
                    className="group relative flex h-full min-h-[300px] flex-col justify-end overflow-hidden rounded-3xl border border-ink-7 shadow-wt-lg transition-all duration-500 ease-[var(--ease-wt)] hover:-translate-y-1.5 hover:border-primary-300 hover:shadow-wt-xl sm:min-h-[360px]"
                  >
                    <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-primary-100 via-primary-50 to-accent-50">
                      {t.primary_image_url ? (
                        <Image
                          src={t.primary_image_url}
                          alt={t.package_name}
                          fill
                          sizes="(max-width: 640px) 86vw, 480px"
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-primary-300 transition-all duration-500 group-hover:scale-110 group-hover:text-primary-400">
                          <MapPin className="h-14 w-14" />
                        </div>
                      )}
                    </div>
                    {/* Per-index tint keeps the overlay readable without
                        hiding the photo — the reference's coloured cards. */}
                    <div
                      aria-hidden
                      className={`absolute inset-0 bg-gradient-to-t ${OVERLAYS[i % OVERLAYS.length]}`}
                    />
                    <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                    <span className="absolute left-4 top-4 z-10 inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-700 shadow-wt-sm backdrop-blur">
                      {t.package_type === "GROUP" ? "Group tour" : t.package_type === "PRIVATE" ? "Private tour" : "Verified"}
                    </span>

                    <div className="relative z-10 p-5 text-white">
                      <div className="flex items-center gap-2 text-[11px] text-white/80">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="truncate">{t.destination}</span>
                        <span aria-hidden>·</span>
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {t.duration_days}D/{t.duration_nights}N
                        </span>
                      </div>
                      <h3 className="mt-1.5 line-clamp-2 text-lg font-extrabold leading-snug tracking-tight">
                        {t.package_name}
                      </h3>
                      <div className="mt-4 flex items-end justify-between gap-3">
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-white/60 bg-white/10 px-3 py-1.5 backdrop-blur">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">From</span>
                          <span className="text-lg font-extrabold leading-none">
                            ₹{Number(t.starting_price ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                          </span>
                        </span>
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-primary-700 shadow-wt-lg transition-all duration-300 group-hover:bg-primary-600 group-hover:text-white">
                          <ArrowRight className="h-[18px] w-[18px] transition-transform duration-300 group-hover:translate-x-0.5" />
                        </span>
                      </div>
                      {t.starting_price == null && (
                        <span className="mt-2 block text-[10px] text-white/70">
                          Price per person, set by the partner
                        </span>
                      )}
                    </div>
                  </Link>
                </MotionTilt>
              </MotionGlow>
            </MotionStaggerItem>
          ))}
        </Carousel>
        <div className="mt-6 text-center">
          <Link
            href="/tours"
            className="inline-flex items-center gap-2 text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors"
          >
            View all tours <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </Container>
    </Section>
  );
}
