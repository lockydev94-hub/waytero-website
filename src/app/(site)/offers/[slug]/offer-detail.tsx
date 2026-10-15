"use client";

/**
 * /offers/[slug] — customer-facing offer detail page.
 *
 * Everything rendered here comes from GET /public/offers/{slug}: title,
 * badge, coupon window, discount rules, T&C and the eligible listings. When
 * the offer has lapsed (coupon deactivated / window closed / links gone)
 * the page stays indexable but shows an honest "offer paused" state with
 * disabled CTAs — no fake availability.
 *
 * Booking CTAs carry ?offer=<slug>&coupon=<code>&offer_name=<title> so the
 * booking surfaces auto-apply the coupon (see src/lib/offerParams.ts).
 */

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, BadgePercent, CalendarRange, CheckCircle2, Clock,
  BedDouble, Hotel as HotelIcon, MapPin, Sparkles, Tag, Ticket, TrainFront,
} from "lucide-react";
import { Container, MotionFadeIn, MotionStagger, MotionStaggerItem } from "@/components/ui";

export interface OfferRoomType {
  id: number;
  name: string;
}
export interface OfferHotel {
  id: number;
  name: string;
  slug: string;
  city: string;
  room_types: OfferRoomType[];
}
export interface OfferTourPackage {
  id: number;
  package_id?: number;
  name: string;
  slug: string;
  destination?: string | null;
}
export interface PublicOfferDetail {
  slug: string;
  title: string;
  short_description: string | null;
  terms_and_conditions: string;
  image_url: string;
  service_type: "CAB" | "HOTEL" | "TOUR";
  badge: string;
  is_available: boolean;
  valid_from: string;
  valid_to: string;
  coupon: {
    code: string;
    discount_type: string;
    discount_value: number;
    max_discount_amount: number | null;
    min_booking_amount: number;
    funding_label: string;
    usages_left: number | null;
  };
  target: {
    type: "CAB" | "HOTEL" | "TOUR";
    vehicle_category_name?: string | null;
    hotels?: OfferHotel[];
    packages?: OfferTourPackage[];
  };
}

const SERVICE_LABEL: Record<PublicOfferDetail["service_type"], string> = {
  CAB: "Cab booking",
  HOTEL: "Hotel stay",
  TOUR: "Tour package",
};

const fmtDay = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
};

const INR = (n: number | string) =>
  `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

function offerHref(o: PublicOfferDetail, path: string): string {
  const qs = new URLSearchParams({
    offer: o.slug,
    coupon: o.coupon.code,
    offer_name: o.title,
  });
  return `${path}?${qs.toString()}`;
}

function OfferCircle({ offer, size = "lg" }: { offer: PublicOfferDetail; size?: "lg" | "sm" }) {
  const [broken, setBroken] = useState(false);
  const box = size === "lg" ? "h-52 w-52 sm:h-64 sm:w-64" : "h-12 w-12";
  return (
    <div className={`relative ${box} flex-shrink-0`}>
      {size === "lg" && (
        <>
          <div aria-hidden className="absolute -inset-4 rounded-full bg-accent-500/25 blur-3xl animate-pulse-soft" />
          <div aria-hidden className="absolute -inset-2 rounded-full border-2 border-dashed border-primary-600/25 animate-orbit" />
        </>
      )}
      <div className="absolute inset-0 overflow-hidden rounded-full ring-4 ring-white shadow-wt-xl">
        {broken || !offer.image_url ? (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-700 via-primary-600 to-accent-500 text-white">
            <Sparkles className={size === "lg" ? "h-10 w-10" : "h-5 w-5"} />
          </div>
        ) : (
          <Image
            src={offer.image_url}
            alt={offer.title}
            fill
            sizes={size === "lg" ? "256px" : "48px"}
            className="object-cover"
            onError={() => setBroken(true)}
          />
        )}
      </div>
    </div>
  );
}

function ListingCta({ href, label, disabled }: { href: string; label: string; disabled: boolean }) {
  if (disabled) {
    return (
      <span className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-ink-7 bg-ink-9 px-5 text-sm font-bold text-ink-4 opacity-60">
        {label}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 shadow-[0_4px_20px_rgba(240,90,34,0.40)] hover:shadow-[0_6px_28px_rgba(240,90,34,0.55)]"
      style={{ background: "linear-gradient(135deg,#F05A22,#E04A12)" }}
    >
      {label}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

export default function OfferDetail({ offer }: { offer: PublicOfferDetail }) {
  const paused = !offer.is_available;
  const c = offer.coupon;

  return (
    <div className="bg-white">
      {/* ── Hero band ─────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden text-white" style={{ background: "linear-gradient(135deg,#0B1B3B 0%,#1A3A8A 55%,#1140A3 100%)" }}>
        <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-accent-500/25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-primary-500/35 blur-3xl" />
        <Container size="xl" className="relative py-12 lg:py-16">
          <MotionFadeIn>
            <nav className="mb-6 text-xs text-white/60">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span className="mx-2">/</span>
              <span className="text-white/85">Offers</span>
            </nav>
          </MotionFadeIn>
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-14">
            <MotionFadeIn delay={0.1} className="shrink-0">
              <div className="animate-float">
                <OfferCircle offer={offer} />
              </div>
            </MotionFadeIn>
            <MotionFadeIn delay={0.2} className="flex-1 text-center lg:text-left">
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider backdrop-blur-md">
                  {offer.service_type === "CAB" && <TrainFront className="h-3.5 w-3.5" />}
                  {offer.service_type === "HOTEL" && <HotelIcon className="h-3.5 w-3.5" />}
                  {offer.service_type === "TOUR" && <MapPin className="h-3.5 w-3.5" />}
                  {SERVICE_LABEL[offer.service_type]} offer
                </span>
                <span className="inline-flex items-center rounded-full bg-gradient-to-r from-accent-500 to-accent-600 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wide shadow-wt-accent">
                  {offer.badge}
                </span>
              </div>
              <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.08] tracking-tight">
                {offer.title}
              </h1>
              {offer.short_description && (
                <p className="mt-4 text-base sm:text-lg text-white/85 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  {offer.short_description}
                </p>
              )}
              <div className="mt-5 flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-sm text-white/80">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarRange className="h-4 w-4 text-accent-400" />
                  {fmtDay(offer.valid_from)} → {fmtDay(offer.valid_to)}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-white/45 bg-white/10 px-2.5 py-1 font-bold tracking-wider backdrop-blur-md">
                  <Tag className="h-3.5 w-3.5 text-accent-400" /> {c.code}
                </span>
              </div>
            </MotionFadeIn>
          </div>
        </Container>
      </section>

      <Container size="xl" className="py-10 lg:py-14">
        {paused && (
          <div className="mb-8 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-5">
            <Clock className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-bold text-amber-900">This offer is currently paused</div>
              <p className="text-sm text-amber-800 mt-1">
                The promotion behind this offer is not active right now, so the coupon can&apos;t be
                applied. You can still browse the eligible listings below — booking works as usual
                without the offer discount.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* ── Discount breakdown ─────────────────────────────── */}
          <div className="lg:col-span-1 rounded-2xl border border-ink-8 bg-gradient-to-br from-ink-9/60 to-white p-6 shadow-wt">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-3">
              <BadgePercent className="h-4 w-4 text-primary-600" /> How the discount works
            </div>
            <div className="mt-4 text-3xl font-extrabold text-ink">{offer.badge}</div>
            <ul className="mt-5 space-y-2.5 text-sm text-ink-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                Coupon code <span className="font-bold tracking-wide">{c.code}</span> — {c.funding_label}
              </li>
              {c.min_booking_amount > 0 && (
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  Minimum booking amount {INR(c.min_booking_amount)}
                </li>
              )}
              {offer.coupon.discount_type === "PERCENT" && c.max_discount_amount != null && (
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  Discount capped at {INR(c.max_discount_amount)}
                </li>
              )}
              {c.usages_left != null && (
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  {c.usages_left} redemption{c.usages_left === 1 ? "" : "s"} left
                </li>
              )}
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                Valid {fmtDay(offer.valid_from)} → {fmtDay(offer.valid_to)}
              </li>
            </ul>
          </div>

          {/* ── Eligible listings ──────────────────────────────── */}
          <div className="lg:col-span-2" data-offer-listings>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-3 mb-4">
              <Ticket className="h-4 w-4 text-primary-600" />
              {offer.service_type === "HOTEL"
                ? "Eligible hotels & room types"
                : offer.service_type === "TOUR"
                  ? "Eligible tour packages"
                  : "Where the offer applies"}
            </div>

            {offer.service_type === "CAB" && (
              <div className="rounded-2xl border border-ink-8 bg-white p-6 shadow-wt flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="h-14 w-14 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
                  <TrainFront className="h-7 w-7" />
                </div>
                <div className="flex-1">
                  <div className="font-extrabold text-ink">
                    {offer.target.vehicle_category_name ?? "Cab rides"}
                  </div>
                  <p className="text-sm text-ink-4 mt-1">
                    Search your route — the coupon auto-applies at the review step for eligible rides.
                  </p>
                </div>
                <ListingCta href={offerHref(offer, "/cabs")} label="Book a cab" disabled={paused} />
              </div>
            )}

            {offer.service_type === "HOTEL" && (
              <MotionStagger className="space-y-4">
                {(offer.target.hotels ?? []).map((h) => (
                  <MotionStaggerItem key={h.id}>
                    <div className="rounded-2xl border border-ink-8 bg-white p-5 sm:p-6 shadow-wt">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="font-extrabold text-ink text-lg leading-snug">{h.name}</div>
                          <div className="text-sm text-ink-4 mt-0.5 inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" /> {h.city}
                          </div>
                        </div>
                        <ListingCta
                          href={offerHref(offer, `/hotels/${h.slug}`)}
                          label="Book with this offer"
                          disabled={paused}
                        />
                      </div>
                      {h.room_types.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {h.room_types.map((rt) => (
                            <span
                              key={rt.id}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-50 border border-primary-600/15 px-2.5 py-1 text-xs font-bold text-primary-700"
                            >
                              <BedDouble className="h-3 w-3" /> {rt.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </MotionStaggerItem>
                ))}
              </MotionStagger>
            )}

            {offer.service_type === "TOUR" && (
              <MotionStagger className="space-y-4">
                {(offer.target.packages ?? []).map((p) => (
                  <MotionStaggerItem key={p.id}>
                    <div className="rounded-2xl border border-ink-8 bg-white p-5 sm:p-6 shadow-wt">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="font-extrabold text-ink text-lg leading-snug">{p.name}</div>
                          {p.destination && (
                            <div className="text-sm text-ink-4 mt-0.5 inline-flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" /> {p.destination}
                            </div>
                          )}
                        </div>
                        <ListingCta
                          href={offerHref(offer, `/tours/${p.slug}`)}
                          label="Book with this offer"
                          disabled={paused}
                        />
                      </div>
                    </div>
                  </MotionStaggerItem>
                ))}
              </MotionStagger>
            )}
          </div>
        </div>

        {/* ── How to use ────────────────────────────────────────── */}
        <div className="mt-12 rounded-2xl border border-ink-8 bg-ink-9/40 p-6 sm:p-8">
          <div className="text-xs font-bold uppercase tracking-wider text-ink-3 mb-5">How to use this offer</div>
          <ol className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              "Pick an eligible listing above and tap Book with this offer.",
              `The coupon ${c.code} is applied automatically at the review step — you'll see the discount before confirming.`,
              "Complete the booking. The discounted amount is what you pay.",
            ].map((text, i) => (
              <li key={i} className="flex gap-3">
                <span className="h-8 w-8 flex-shrink-0 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 text-white text-sm font-extrabold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="text-sm text-ink-2 leading-relaxed pt-1">{text}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* ── Terms ────────────────────────────────────────────── */}
        <div className="mt-10">
          <div className="text-xs font-bold uppercase tracking-wider text-ink-3 mb-3">
            Terms &amp; conditions
          </div>
          <div className="whitespace-pre-line rounded-2xl border border-ink-8 bg-white p-6 text-sm text-ink-2 leading-relaxed shadow-wt">
            {offer.terms_and_conditions}
          </div>
        </div>
      </Container>

      {/* ── Sticky CTA (mobile) ─────────────────────────────────── */}
      {!paused && (
        <div className="sticky bottom-0 z-40 border-t border-ink-8 bg-white/90 backdrop-blur-md p-3 sm:hidden">
          {offer.service_type === "CAB" ? (
            <Link
              href={offerHref(offer, "/cabs")}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-white font-bold text-sm"
              style={{ background: "linear-gradient(135deg,#F05A22,#E04A12)" }}
            >
              Book with this offer <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() =>
                document.querySelector("[data-offer-listings]")?.scrollIntoView({ behavior: "smooth" })
              }
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-white font-bold text-sm"
              style={{ background: "linear-gradient(135deg,#F05A22,#E04A12)" }}
            >
              See eligible listings <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
