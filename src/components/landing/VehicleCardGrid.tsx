import Image from "next/image";
import Link from "next/link";
import { Users, Briefcase, ArrowRight } from "lucide-react";
import { Container, Section, SectionHeader, MotionStagger, MotionStaggerItem } from "@/components/ui";
import { enumLabel } from "./format";
import type { LandingVehicle } from "@/lib/landingIndex";

// ============================================================
// VehicleCardGrid — the "choose your vehicle" rail on cab pages.
// Cards link into the booking form; supply is real (active
// vehicle_categories only), so an empty grid renders nothing.
// ============================================================

export default function VehicleCardGrid({
  vehicles,
  title,
  ctaLink,
}: {
  vehicles: LandingVehicle[];
  title?: string | null;
  ctaLink?: string | null;
}) {
  if (!vehicles.length) return null;
  const label = (v: LandingVehicle) => enumLabel(v.category_name);

  return (
    <Section bg="muted" pad="md">
      <Container size="xl">
        <SectionHeader
          eyebrow="Fleet"
          title={title ?? "Choose your vehicle"}
          subtitle="Every category below is bookable on WayTero in this city."
        />
        <MotionStagger className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {vehicles.map((v) => (
            <MotionStaggerItem key={v.id}>
              <div className="group h-full overflow-hidden rounded-2xl border border-ink-7 bg-white transition-all hover:-translate-y-1 hover:border-primary-200 hover:shadow-wt-lg">
                <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-accent-100 via-accent-50 to-primary-50">
                  {v.image_url ? (
                    <Image
                      src={v.image_url}
                      alt={label(v)}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : v.icon_url ? (
                    <Image
                      src={v.icon_url}
                      alt={label(v)}
                      fill
                      sizes="120px"
                      className="absolute inset-0 m-auto h-20 w-20 object-contain"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Users className="h-12 w-12 text-accent-300" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-base font-bold text-ink transition-colors group-hover:text-primary-600">
                    {label(v)}
                  </h3>
                  <div className="mt-2 flex items-center gap-4 text-xs text-ink-4">
                    {v.seating_capacity ? (
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> {v.seating_capacity} seats
                      </span>
                    ) : null}
                    {v.luggage_capacity ? (
                      <span className="inline-flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5" /> {v.luggage_capacity} bags
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </MotionStaggerItem>
          ))}
        </MotionStagger>
        {ctaLink && (
          <div className="mt-8 text-center">
            <Link
              href={ctaLink}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-bold text-white shadow-wt-primary transition-all hover:-translate-y-0.5 hover:bg-primary-700"
            >
              Book a cab <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </Container>
    </Section>
  );
}
