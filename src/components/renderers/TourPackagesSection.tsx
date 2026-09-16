import Link from "next/link";
import { Clock, Star, MapPin, ChevronRight } from "lucide-react";
import { Container, Section, SectionHeader, MotionTilt, MotionGlow } from "@/components/ui";
import { MotionStagger, MotionStaggerItem } from "@/components/ui";
import { pick } from "@/types/cms";
import type { PublicTourPackage } from "@/services/tourService";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

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

  // Empty catalogue → Coming Soon (no fake tours, ever).
  if (tours.length === 0) {
    return (
      <Section bg="muted" pad="lg" id="tours" overlay="dots">
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
                Tour packages are coming soon
              </h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-3">
                Curated tour packages are being added by our verified operators.
                Check back shortly — your next trip is being planned.
              </p>
            </div>
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <Section bg="muted" pad="lg" id="tours" overlay="dots">
      <Container size="lg">
        <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} accent="primary" underline animatedEyebrow />
        <MotionStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tours.map((t) => (
            <MotionStaggerItem key={t.id} className="h-full">
              <MotionGlow color="primary" intensity={0.2} size={300} className="h-full rounded-2xl">
                <MotionTilt max={4} className="h-full">
                  <Link
                    href={`/tours/${t.slug}`}
                    className="group relative flex h-full flex-col bg-white rounded-2xl overflow-hidden border border-ink-7 hover:border-primary-200 hover:shadow-wt-xl transition-all duration-300 ease-[var(--ease-wt)]"
                  >
                    <div className="relative aspect-[4/3] bg-gradient-to-br from-primary-100 via-primary-50 to-accent-50 overflow-hidden">
                      {t.primary_image_url ? (
                        <img
                          src={t.primary_image_url}
                          alt={t.package_name}
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-primary-300 group-hover:scale-110 group-hover:text-primary-400 transition-all duration-500">
                          <MapPin className="h-12 w-12" />
                        </div>
                      )}
                      <span className="absolute top-3 left-3 z-10 inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur text-primary-700 shadow-wt-sm">
                        {t.package_type === "GROUP" ? "Group tour" : "Verified"}
                      </span>
                      <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-primary-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 text-xs text-ink-4 mb-2">
                        <MapPin className="h-3.5 w-3.5" /> {t.destination}
                        <span>·</span>
                        <Clock className="h-3.5 w-3.5" /> {t.duration_days}D/{t.duration_nights}N
                      </div>
                      <h3 className="text-base font-bold text-ink mb-3 line-clamp-1 group-hover:text-primary-600 transition-colors">
                        {t.package_name}
                      </h3>
                      <div className="flex items-end justify-between mt-auto">
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-extrabold text-gradient-primary">
                              ₹{Number(t.starting_price ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                            </span>
                          </div>
                          <div className="text-[11px] text-ink-4">per person</div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </MotionTilt>
              </MotionGlow>
            </MotionStaggerItem>
          ))}
        </MotionStagger>
        <div className="mt-8 text-center">
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
