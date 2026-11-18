/**
 * /cabs/routes/[slug] — one intercity corridor, priced live.
 *
 * Everything on this page comes from GET /public/routes/{slug}: the route
 * itself (endpoints, distance, admin copy) plus one FareBreakdownItem per
 * vehicle type the admin linked. Prices are computed by the same fare
 * engine the booking flow uses, so the number shown here is the number the
 * results page quotes — including the minimum-distance billing, which is
 * stated rather than hidden.
 *
 * Server component: no interaction beyond links, so no client bundle.
 */

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Clock, Info, MapPin, Navigation, Route as RouteIcon,
  ShieldCheck, Users,
} from "lucide-react";
import { Container, Section, Badge } from "@/components/ui";
import { MotionStagger, MotionStaggerItem, MotionGlow } from "@/components/ui";

export interface RouteVehicle {
  vehicle_category_id: number;
  category_name: string;
  seating_capacity: number | null;
  image_url: string | null;
  icon_url: string | null;
  vehicle_class: string;
  vehicle_label: string;
  vehicle_models: string | null;
  rental_type: string;
  included_hours: number;
  included_km: number;
  package_price: number | string;
  extra_km: number | string;
  extra_km_rate: number | string;
  extra_km_charge: number | string;
  extra_hour_rate: number | string;
  driver_allowance: number | string;
  midnight_charge: number | string;
  total: number | string;
  rate_source: string;
  toll_included: boolean;
  parking_included: boolean;
  night_halt_included: boolean;
  actual_distance_km: number;
}

export interface PublicRoute {
  id: number;
  slug: string;
  origin_label: string;
  destination_label: string;
  origin_city_id: number | null;
  destination_city_id: number | null;
  pricing_city_id: number;
  pricing_city_name: string | null;
  distance_km: number | string;
  distance_source: "GOOGLE" | "HAVERSINE" | "MANUAL";
  description: string;
  terms_and_conditions: string;
  image_url: string | null;
  trip_type: string;
  vehicles: RouteVehicle[];
}

export interface RelatedRoute {
  id: number;
  slug: string;
  origin_label: string;
  destination_label: string;
  distance_km: number | string;
}

const money = (v: number | string | null | undefined) =>
  `₹${Number(v ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const km = (v: number | string | null | undefined) => Number(v ?? 0).toFixed(0);

export default function RouteDetail({
  route,
  related,
}: {
  route: PublicRoute;
  related: RelatedRoute[];
}) {
  const actualKm = Number(route.distance_km);
  const distanceLabel = `${actualKm.toFixed(1)} km`;

  // Deep link into the existing results page. trip_type must be explicit —
  // the results view defaults a bare link to LOCAL, which would quote the
  // wrong rules for an intercity drop.
  const bookParams = new URLSearchParams({
    city_id: String(route.pricing_city_id),
    distance_km: String(actualKm),
    trip_type: route.trip_type || "OUTSTATION",
    pickup: route.origin_label,
    drop: route.destination_label,
  });
  const bookHref = `/cabs/results?${bookParams.toString()}`;

  return (
    <>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Section bg="white" pad="sm" id="route-head">
        <Container size="lg">
          <Link
            href="/cabs/routes"
            className="inline-flex items-center gap-1.5 text-[13px] font-bold text-ink-3 transition-colors hover:text-primary-600"
          >
            <ArrowLeft className="h-4 w-4" /> All routes
          </Link>

          <div className="mt-4 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-600/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-700">
                <RouteIcon className="h-3.5 w-3.5" /> Inter-city cab
              </span>
              <h1 className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-2xl font-extrabold tracking-tight text-ink sm:text-[34px] sm:leading-tight">
                {route.origin_label}
                <Navigation className="h-5 w-5 shrink-0 text-primary-500 sm:h-6 sm:w-6" />
                {route.destination_label}
              </h1>
              <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-ink-3">
                <span className="inline-flex items-center gap-1.5 font-bold text-ink">
                  <MapPin className="h-4 w-4 text-primary-600" /> {distanceLabel}
                </span>
                <Badge size="sm" tone={route.distance_source === "HAVERSINE" ? "warning" : "success"}>
                  {route.distance_source === "GOOGLE"
                    ? "Distance from Google Maps"
                    : route.distance_source === "HAVERSINE"
                      ? "Distance estimated"
                      : "Distance entered by WayTero"}
                </Badge>
                {route.pricing_city_name && (
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-primary-600" />
                    Fares from {route.pricing_city_name}
                  </span>
                )}
              </p>
              {route.description && (
                <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-3">{route.description}</p>
              )}
            </div>

            {route.image_url && (
              <div className="relative aspect-[16/9] overflow-hidden rounded-3xl border border-ink-7 shadow-wt-lg">
                <Image
                  src={route.image_url}
                  alt={`${route.origin_label} to ${route.destination_label}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 560px"
                  className="object-cover"
                  priority
                />
              </div>
            )}
          </div>
        </Container>
      </Section>

      {/* ── Vehicles at live fares ─────────────────────────────────────── */}
      <Section bg="muted" pad="md" id="route-fares">
        <Container size="lg">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
                Vehicles for this route
              </h2>
              <p className="mt-1 text-sm text-ink-3">
                Priced from the same published rate card the booking flow charges — the outstation
                package for {actualKm.toFixed(0)} km, with anything beyond its included kilometres
                itemised.
              </p>
            </div>
            <Link
              href={bookHref}
              className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-5 py-2.5 text-sm font-bold text-white shadow-wt-primary transition-all hover:-translate-y-0.5 hover:bg-primary-700"
            >
              Book this route <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {route.vehicles.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-ink-6 bg-white p-8 text-center">
              <p className="text-sm font-bold text-ink">No vehicle is priced for this route yet</p>
              <p className="mt-1 text-sm text-ink-3">
                Fare rules for {route.pricing_city_name ?? "this city"} do not cover any of the vehicle types on
                this corridor. Support can help you book it in the meantime.
              </p>
            </div>
          ) : (
            <MotionStagger className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {route.vehicles.map((v) => {
                const extraKm = Number(v.extra_km ?? 0);
                return (
                  <MotionStaggerItem key={v.vehicle_category_id} className="h-full">
                    <MotionGlow color="primary" intensity={0.18} size={280} className="h-full rounded-2xl">
                      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-ink-7 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-primary-300 hover:shadow-wt-xl">
                        <div className="relative h-28 bg-gradient-to-br from-primary-100 via-primary-50 to-accent-50">
                          {v.image_url || v.icon_url ? (
                            <Image
                              src={(v.image_url ?? v.icon_url) as string}
                              alt={v.category_name}
                              fill
                              sizes="360px"
                              className="object-contain p-3"
                            />
                          ) : (
                            <div className="absolute inset-0 grid place-items-center text-primary-300">
                              <Users className="h-9 w-9" />
                            </div>
                          )}
                          <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-primary-700 shadow-wt-sm backdrop-blur">
                            {money(v.total)}
                          </span>
                        </div>

                        <div className="flex flex-1 flex-col p-4">
                          <h3 className="text-[15px] font-extrabold capitalize tracking-tight text-ink">
                            {v.category_name.toLowerCase().replace(/_/g, " ")}
                          </h3>
                          <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-ink-4">
                            <Users className="h-3.5 w-3.5" />
                            {v.seating_capacity ?? "—"} seats
                          </p>

                          <dl className="mt-3 space-y-1.5 border-t border-dashed border-ink-6 pt-3 text-[12px]">
                            <Row
                              label={`Package · ${v.included_hours}h / ${v.included_km} km`}
                              value={money(v.package_price)}
                            />
                            {extraKm > 0 && (
                              <Row
                                label={`Extra distance · ${extraKm.toFixed(0)} km × ${money(v.extra_km_rate)}`}
                                value={money(v.extra_km_charge)}
                              />
                            )}
                            {Number(v.driver_allowance) > 0 && (
                              <Row label="Driver allowance" value={money(v.driver_allowance)} />
                            )}
                            {Number(v.midnight_charge) > 0 && (
                              <Row label="Midnight return charge" value={money(v.midnight_charge)} />
                            )}
                          </dl>

                          {extraKm > 0 && (
                            <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-accent-50 px-2.5 py-1.5 text-[11px] leading-snug text-accent-800">
                              <Info className="mt-px h-3.5 w-3.5 shrink-0" />
                              The package covers {v.included_km} km; this {distanceLabel} trip bills the
                              remaining {extraKm.toFixed(0)} km at {money(v.extra_km_rate)}/km.
                            </p>
                          )}
                          {(v.toll_included || v.parking_included || v.night_halt_included) && (
                            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-ink-4">
                              <Clock className="h-3.5 w-3.5" />
                              {[
                                v.toll_included ? "toll" : null,
                                v.parking_included ? "parking" : null,
                                v.night_halt_included ? "night halt" : null,
                              ]
                                .filter(Boolean)
                                .join(", ")}{" "}
                              included
                            </p>
                          )}

                          <div className="mt-auto pt-4">
                            <Link
                              href={bookHref}
                              className="flex items-center justify-center gap-1.5 rounded-full border border-primary-200 bg-primary-50/60 px-4 py-2 text-[13px] font-bold text-primary-700 transition-all hover:border-primary-400 hover:bg-primary-600 hover:text-white"
                            >
                              Choose {v.category_name.toLowerCase().replace(/_/g, " ")}
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </MotionGlow>
                  </MotionStaggerItem>
                );
              })}
            </MotionStagger>
          )}

          <p className="mt-5 flex items-start gap-2 text-[12px] leading-relaxed text-ink-4">
            <Info className="mt-px h-4 w-4 shrink-0" />
            The estimate is for a one-way drop between these two places at the distance shown. Waiting time,
            tolls, parking and permit charges are billed as they occur.
          </p>
        </Container>
      </Section>

      {/* ── Terms ─────────────────────────────────────────────────────── */}
      {route.terms_and_conditions && (
        <Section bg="white" pad="md" id="route-terms">
          <Container size="lg">
            <h2 className="text-lg font-extrabold tracking-tight text-ink">Terms &amp; conditions</h2>
            <div className="mt-3 whitespace-pre-line rounded-2xl border border-ink-7 bg-ink-9/50 p-5 text-[13px] leading-relaxed text-ink-3">
              {route.terms_and_conditions}
            </div>
          </Container>
        </Section>
      )}

      {/* ── Related routes ─────────────────────────────────────────────── */}
      {related.length > 0 && (
        <Section bg="muted" pad="md" id="related-routes">
          <Container size="lg">
            <h2 className="text-lg font-extrabold tracking-tight text-ink">Other routes you can switch to</h2>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/cabs/routes/${r.slug}`}
                  className="group inline-flex items-center gap-2 rounded-full border border-ink-7 bg-white px-4 py-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-300 hover:bg-primary-50/50 hover:shadow-wt-lg"
                >
                  <Navigation className="h-3.5 w-3.5 text-primary-600" />
                  <span className="text-[13px] font-bold text-ink group-hover:text-primary-700">
                    {r.origin_label}
                    <span className="mx-1 text-ink-4">→</span>
                    {r.destination_label}
                  </span>
                  <span className="text-[11px] text-ink-4">{km(r.distance_km)} km</span>
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      )}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-ink-4">{label}</dt>
      <dd className="font-bold text-ink">{value}</dd>
    </div>
  );
}
