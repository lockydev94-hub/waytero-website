import Link from "next/link";
import Image from "next/image";
import { MapPin, ArrowRight, Compass } from "lucide-react";
import { Container, Section, Carousel } from "@/components/ui";
import { MotionStaggerItem } from "@/components/ui";
import { pick, type BandTone } from "@/types/cms";
import type { PublicTourPackage } from "@/services/tourService";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

const INR = (n: number) =>
  `₹${Math.round(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

interface TourPackagesSectionProps {
  variant: Record<string, unknown>;
  /** Homepage tone, decided by HomepageServer. Defaults to this band's
   *  own literal so every other page that uses it is unchanged. */
  bg?: BandTone;
}

/**
 * TourPackagesSection — homepage tours strip.
 *
 * Fully DB-driven: shows only tour packages that admin/partners actually
 * added (GET /public/tours/packages). No hardcoded placeholder tours —
 * when the catalogue is empty the whole section becomes an honest
 * "Coming soon" state. The first added package renders automatically.
 *
 * Layout: a left-aligned heading with the orange flanking dashes, the
 * "View All Packages" link on the right, then four-up white cards — photo
 * with the duration pill, title, starting city and the per-person price.
 * Doc Ref: public_tour_api.py (packages), BRD Part 4 §57-92
 */
export default async function TourPackagesSection({ variant, bg = "muted" }: TourPackagesSectionProps) {
  const title = pick<string>(variant, "headline", pick<string>(variant, "title", "Popular Tour Packages"));
  const subtitle = pick<string>(variant, "subheadline", pick<string>(variant, "subtitle", "Explore top destinations with our best-selling tour packages."));
  const viewAll = pick<string>(variant, "cta_text", "View All Packages");
  const viewAllHref = pick<string>(variant, "cta_link", "/tours");

  let tours: PublicTourPackage[] = [];
  try {
    // Raw fetch (not tourService) — this runs on the server and the axios
    // client is browser-only; revalidate keeps the homepage ISR-cacheable.
    const res = await fetch(`${API_BASE}/public/tours/packages?page=1&page_size=8`, {
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
    <Section bg={bg} pad="none" id="tours" className="pt-7 pb-10 lg:pt-8 lg:pb-12">
      <Container size="wide">
        {/* Heading block: the dashes are decorative rules around the title,
            so this is hand-rolled rather than SectionHeader (which stacks an
            eyebrow above and a rule below). */}
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6 lg:mb-6">
          <div>
            <h2 className="flex items-center gap-2.5 text-[21px] font-extrabold tracking-[-0.01em] text-ink sm:text-[23px] lg:text-[25px]">
              <span aria-hidden className="h-[3px] w-4 shrink-0 rounded-full bg-accent-500" />
              <span>{title}</span>
              <span aria-hidden className="h-[3px] w-4 shrink-0 rounded-full bg-accent-500" />
            </h2>
            {subtitle && <p className="mt-1 text-[13px] leading-relaxed text-ink-4">{subtitle}</p>}
          </div>
          <Link
            href={viewAllHref}
            className="inline-flex shrink-0 items-center gap-1.5 text-[13px] font-bold text-primary-600 transition-colors hover:text-primary-700 sm:pt-1.5"
          >
            {viewAll}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>

        <Carousel ariaLabel="Tour packages">
          {tours.map((t) => (
            <MotionStaggerItem
              key={t.id}
              className="w-[74%] min-w-[240px] shrink-0 grow snap-start sm:w-[calc(50%_-_10px)] sm:min-w-0 lg:w-[calc(25%_-_15px)]"
            >
              <Link
                href={`/tours/${t.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-xl border border-ink-7 bg-white shadow-wt-sm transition-all duration-300 ease-[var(--ease-wt)] hover:-translate-y-1 hover:border-primary-200 hover:shadow-wt-lg"
              >
                {/* 3:2 is the shape admins upload (admin-portal PackageEditor
                    crops to 1200×800) and the shape of the seeded posters, so
                    the photo fills the card without being sliced. */}
                <div className="relative aspect-[3/2] w-full overflow-hidden bg-primary-50">
                  {t.primary_image_url ? (
                    <Image
                      src={t.primary_image_url}
                      alt={t.package_name}
                      fill
                      sizes="(max-width: 640px) 74vw, (max-width: 1024px) 46vw, 260px"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-primary-300">
                      <Compass className="h-10 w-10" />
                    </div>
                  )}
                  <span className="absolute bottom-2.5 left-2.5 inline-flex items-center rounded-md bg-white/95 px-2 py-0.5 text-[10.5px] font-bold text-ink shadow-sm backdrop-blur">
                    {t.duration_days} Days - {t.duration_nights} Night{t.duration_nights === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-3.5">
                  <h3 className="line-clamp-2 text-[14.5px] font-bold leading-snug text-ink transition-colors group-hover:text-primary-700">
                    {t.package_name}
                  </h3>
                  <p className="mt-1.5 flex items-start gap-1 text-[11.5px] leading-snug text-ink-4">
                    <MapPin className="mt-[1px] h-3 w-3 shrink-0 text-accent-500" aria-hidden />
                    <span className="line-clamp-1">{t.destination}</span>
                  </p>

                  <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                    <p className="min-w-0 truncate">
                      <span className="text-[10.5px] font-semibold text-ink-4">From </span>
                      {t.starting_price != null ? (
                        <>
                          <span className="text-[17px] font-extrabold leading-none text-accent-600">
                            {INR(t.starting_price)}
                          </span>
                          <span className="text-[10.5px] text-ink-4"> /person</span>
                        </>
                      ) : (
                        <span className="text-[13px] font-bold text-ink">On request</span>
                      )}
                    </p>
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent-500 to-accent-600 text-white shadow-wt-sm transition-transform duration-300 group-hover:translate-x-0.5">
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </span>
                  </div>
                </div>
              </Link>
            </MotionStaggerItem>
          ))}
        </Carousel>
      </Container>
    </Section>
  );
}
