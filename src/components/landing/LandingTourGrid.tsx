import Image from "next/image";
import Link from "next/link";
import { Clock3, MapPin, Compass } from "lucide-react";
import { Container, Section, SectionHeader, MotionStagger, MotionStaggerItem } from "@/components/ui";
import { INR } from "./format";
import type { LandingTour } from "@/lib/landingIndex";

// ============================================================
// LandingTourGrid — hand-rolled from the landing payload rather
// than reusing tours/TourCard, which needs a full PublicTourPackage
// (media[], status, min/max persons) that the slim landing bundle
// deliberately does not carry.
// ============================================================

export default function LandingTourGrid({
  tours,
  title,
  resultsHref,
}: {
  tours: LandingTour[];
  title?: string | null;
  resultsHref?: string | null;
}) {
  if (!tours.length) return null;

  return (
    <Section bg="white" pad="md">
      <Container size="xl">
        <SectionHeader
          eyebrow="Tours"
          title={title ?? "Tour packages"}
          subtitle="Curated multi-day tours with clear itineraries and upfront pricing."
        />
        <MotionStagger className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {tours.map((t) => (
            <MotionStaggerItem key={t.id}>
              <Link
                href={`/tours/${t.slug ?? t.id}`}
                className="group block h-full overflow-hidden rounded-2xl border border-ink-7 bg-white transition-all hover:-translate-y-1 hover:border-primary-200 hover:shadow-wt-lg"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-primary-800 to-accent-900">
                  {t.primary_image_url ? (
                    <Image
                      src={t.primary_image_url}
                      alt={t.package_name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Compass className="h-12 w-12 text-white/30" />
                    </div>
                  )}
                  {t.duration_days ? (
                    <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                      <Clock3 className="h-3 w-3 text-accent-300" />
                      {t.duration_days}D / {t.duration_nights ?? 0}N
                    </span>
                  ) : null}
                </div>
                <div className="p-5">
                  <h3 className="line-clamp-1 text-base font-bold text-ink transition-colors group-hover:text-primary-600">
                    {t.package_name}
                  </h3>
                  <div className="mt-1 flex items-center gap-1 text-xs text-ink-4">
                    <MapPin className="h-3.5 w-3.5" />
                    {[t.destination, t.city_name].filter(Boolean).join(", ")}
                  </div>
                  {t.short_description && (
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-3">
                      {t.short_description}
                    </p>
                  )}
                  <div className="mt-3 flex items-end justify-between border-t border-ink-7 pt-3">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-4">
                        from
                      </span>
                      <span className="text-lg font-extrabold text-ink">
                        {t.starting_price != null ? INR(t.starting_price) : "On request"}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-primary-600">View →</span>
                  </div>
                </div>
              </Link>
            </MotionStaggerItem>
          ))}
        </MotionStagger>

        {resultsHref && (
          <div className="mt-10 text-center">
            <Link
              href={resultsHref}
              className="inline-flex items-center gap-2 rounded-xl border border-primary-200 bg-white px-6 py-3 text-sm font-bold text-primary-700 transition-all hover:-translate-y-0.5 hover:bg-primary-50"
            >
              Browse all tour packages
            </Link>
          </div>
        )}
      </Container>
    </Section>
  );
}
