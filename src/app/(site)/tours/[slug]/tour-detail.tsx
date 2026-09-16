"use client";

/**
 * /tours/[slug] — Tour detail page (enhanced).
 *
 * Adds on top of the previous version:
 *   - Multi-image gallery (carousel-style)
 *   - Trust badges row (verified operator / secure booking / free cancellation)
 *   - "What's included / not included" T&C collapsible at bottom
 *   - Other tours in {city} related strip
 *   - Sticky "Book now" CTA on mobile (bottom bar)
 *   - Trust-badges row + responsive image gallery
 *
 * Doc Ref: BRD_PART_5_TOUR_PACKAGE_MANAGEMENT §6
 */

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, CalendarDays, Check, Clock3, MapPin, ShieldCheck, Sparkles, Users,
  ChevronLeft, ChevronRight, X, BadgeCheck, Lock, RefreshCw, Phone, MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { tourService, PublicTourPackage } from "@/services/tourService";
import { useSupportPhone } from "@/hooks/useSupportPhone";
import { telHref } from "@/lib/supportPhone";
import BookingAuthGate from "@/components/booking/BookingAuthGate";
import TourBookingReviewModal from "@/components/booking/TourBookingReviewModal";
import TourBookingSuccessModal from "@/components/booking/TourBookingSuccessModal";
import ProfileCompletionModal from "@/components/auth/ProfileCompletionModal";
import { useAuth } from "@/hooks/useAuth";
import TourCard from "@/components/tours/TourCard";
import { MotionStagger, MotionStaggerItem, MotionFadeIn, IconBox } from "@/components/ui";

const INR = (n: number) => `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export default function TourDetailPage({
  initialTour,
}: {
  initialTour?: PublicTourPackage | null;
}) {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const router = useRouter();
  const supportPhone = useSupportPhone();
  // Prefill from the hero search: /tours/{slug}?date=YYYY-MM-DD&persons=N
  const searchParams = useSearchParams();
  const heroDate = searchParams?.get("date") ?? "";
  const heroPersons = Number(searchParams?.get("persons") ?? "") || 0;
  const auth = useAuth();
  const { accessToken, user } = auth;
  const [tour, setTour] = useState<PublicTourPackage | null>(initialTour ?? null);
  const [related, setRelated] = useState<PublicTourPackage[]>([]);
  const [pax, setPax]         = useState(2);
  const [paxTouched, setPaxTouched] = useState(false); // user changed travellers manually
  const [date, setDate]       = useState("");
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(!initialTour);
  const [booking, setBooking] = useState(false);
  // Booking flow: auth gate → profile completion → review → success
  const [authOpen, setAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [successBooking, setSuccessBooking] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  // Load tour — the server-fetched payload (SSR) short-circuits the client
  // fetch so the package name/description are in the initial HTML.
  useEffect(() => {
    if (!slug) return;
    if (initialTour && initialTour.slug === slug) {
      setTour(initialTour);
      setLoading(false);
      setMessage("");
      if (initialTour.city_id) {
        tourService
          .related(initialTour.slug, initialTour.city_id)
          .then(setRelated)
          .catch(() => {});
      }
      return;
    }
    setLoading(true);
    setMessage("");
    tourService
      .get(slug)
      .then((data) => {
        setTour(data);
        // Load related
        if (data.city_id) {
          tourService.related(data.slug, data.city_id).then(setRelated).catch(() => {});
        }
      })
      .catch(() => setMessage("This tour package is no longer available."))
      .finally(() => setLoading(false));
  }, [slug, initialTour]);

  // Prefill date + traveller count from the hero search (only when they
  // haven't already been set by the user).
  useEffect(() => {
    if (heroDate && !date) setDate(heroDate);
    if (heroPersons >= (tour?.minimum_persons ?? 1) && !paxTouched) {
      setPax(Math.min(heroPersons, tour?.maximum_persons || heroPersons));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroDate, heroPersons, tour]);

  // Real-time quote
  useEffect(() => {
    if (tour) {
      tourService.quote(tour.id, pax).then(setQuote).catch(() => setQuote(null));
    }
  }, [tour, pax]);

  const minDate = useMemo(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10), []);

  // Trip end date — derived from the start date + package duration. There is
  // no fixed departure date on a package; the customer picks the start and
  // the end follows automatically (duration_days - 1 nights). Format via local
  // date parts so IST doesn't shift the day when using toISOString().
  // NOTE: must stay above the early returns — hooks can't be conditional.
  const endDate = useMemo(() => {
    if (!date || !tour) return "";
    const d = new Date(`${date}T00:00:00`);
    d.setDate(d.getDate() + (tour.duration_days - 1));
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, [date, tour]);

  const fmtDay = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };
  const perPerson = quote && pax > 0 ? Math.round(quote.total_amount / pax) : 0;

  // ── Booking flow: auth → profile completion → review → confirm ──
  // Mirrors the hotel/cab flows: the customer reviews the full trip (dates,
  // travellers, price) and enters the primary traveller's details BEFORE
  // the booking is created.
  const openReview = async () => {
    setMessage("");
    // New Google/OTP customers may be missing mobile or name — ask for it
    // first (ProfileCompletionModal) so the booking carries a real profile.
    await auth.checkProfileCompletion();
    if (!useAuth.getState().hasCompleteProfile) {
      setProfileOpen(true);
      return;
    }
    setReviewOpen(true);
  };

  const submit = async () => {
    if (!tour) return;
    if (!date) {
      setMessage("Choose a travel date.");
      return;
    }
    if (!accessToken) {
      setAuthOpen(true);
      return;
    }
    await openReview();
  };

  const confirmBooking = async (opts: { traveller_name: string; traveller_mobile?: string }) => {
    if (!tour || !date) return;
    if (opts.traveller_name.trim().length < 2) {
      setMessage("Name must be at least 2 characters.");
      return;
    }
    setBooking(true);
    setMessage("");
    try {
      const result = await tourService.book({
        package_id: tour.id,
        travel_start_date: date,
        persons_count: pax,
        participants: [{
          participant_name: opts.traveller_name.trim(),
          mobile: opts.traveller_mobile?.trim() || undefined,
        }],
      });
      setReviewOpen(false);
      setSuccessBooking(result);
    } catch (e: any) {
      setMessage(e?.response?.data?.message ?? e?.response?.data?.detail ?? "Could not create this booking.");
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-ink-8 px-6 py-24 text-center text-ink-3">
        <div className="mx-auto h-12 w-12 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin" />
        <p className="mt-4 text-sm">Loading your itinerary…</p>
      </main>
    );
  }

  if (!tour) {
    return (
      <main className="min-h-screen bg-ink-8 px-6 py-24 text-center">
        <p className="text-ink-3">{message || "Tour not found"}</p>
        <Link href="/tours" className="mt-5 inline-flex text-primary-600 font-bold">
          Browse all tours
        </Link>
      </main>
    );
  }

  const hero = tour.media.find(m => m.is_primary)?.media_url || tour.media[0]?.media_url;
  const gallery = tour.media.length > 0 ? tour.media : hero ? [{ media_url: hero, is_primary: true }] : [];

  return (
    <main className="bg-ink-8 min-h-screen pb-32 md:pb-20">
      {/* ── Hero band ────────────────────────────────────────── */}
      {/* bg-primary-950 isn't in the theme palette (stops at primary-900) —
          the missing utility made the band transparent, so white hero text
          sat on a light page background and was nearly invisible. */}
      <section className="bg-primary-900 text-white">
        <div className="mx-auto max-w-6xl px-5 pt-8 pb-12">
          <Link href="/tours" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm font-semibold">
            <ArrowLeft className="h-4 w-4" /> All tours
          </Link>
          <div className="mt-8 grid lg:grid-cols-[1.2fr_.8fr] gap-10 items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-accent-300">
                <Sparkles className="h-3.5 w-3.5" /> Verified partner package
              </div>
              <h1 className="mt-4 text-4xl sm:text-6xl font-black tracking-tight">{tour.package_name}</h1>
              <p className="mt-4 max-w-2xl text-lg text-white/75">{tour.short_description || tour.description}</p>
              <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/80">
                <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-accent-300" />{tour.destination}</span>
                <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-accent-300" />{tour.duration_days} days / {tour.duration_nights} nights</span>
                <span className="inline-flex items-center gap-2"><Users className="h-4 w-4 text-accent-300" />{tour.minimum_persons}–{tour.maximum_persons || "∞"} travellers</span>
                {tour.partner_name && <span className="inline-flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-accent-300" />{tour.partner_name}</span>}
              </div>
            </div>
            {hero ? (
              <button
                type="button"
                onClick={() => { setGalleryIndex(0); setLightboxOpen(true); }}
                className="w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-white/10 group relative"
              >
                <img src={hero} alt={tour.package_name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                {gallery.length > 1 && (
                  <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-extrabold text-white">
                    1 / {gallery.length} · View all
                  </span>
                )}
              </button>
            ) : (
              <div className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-primary-800 to-accent-900 grid place-items-center">
                <MapPin className="h-20 w-20 text-white/20" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Trust badges ─────────────────────────────────────── */}
      <div className="border-b border-ink-7 bg-white/85 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-5 py-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="group flex items-center gap-3 rounded-xl p-2 -m-2 transition-all duration-200 hover:bg-emerald-50/40">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-wt-sm group-hover:scale-110 group-hover:-rotate-3 transition-transform">
              <BadgeCheck className="h-5 w-5" />
            </span>
            <div>
              <div className="text-sm font-extrabold text-ink">Verified operator</div>
              <div className="text-xs text-ink-3">Background-checked partners</div>
            </div>
          </div>
          <div className="group flex items-center gap-3 rounded-xl p-2 -m-2 transition-all duration-200 hover:bg-primary-50/40">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-wt-sm group-hover:scale-110 group-hover:-rotate-3 transition-transform">
              <Lock className="h-5 w-5" />
            </span>
            <div>
              <div className="text-sm font-extrabold text-ink">Secure booking</div>
              <div className="text-xs text-ink-3">Encrypted payment & data</div>
            </div>
          </div>
          <div className="group flex items-center gap-3 rounded-xl p-2 -m-2 transition-all duration-200 hover:bg-accent-50/40">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 text-white shadow-wt-sm group-hover:scale-110 group-hover:-rotate-3 transition-transform">
              <RefreshCw className="h-5 w-5" />
            </span>
            <div>
              <div className="text-sm font-extrabold text-ink">Free cancellation</div>
              <div className="text-xs text-ink-3">Up to 7 days before travel</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 mt-8 relative grid lg:grid-cols-[1fr_380px] gap-8">
        {/* ── Left: itinerary, inclusions, etc ──────────────── */}
        <div className="space-y-6">
          {/* Gallery thumbnails strip */}
          {gallery.length > 1 && (
            <section className="rounded-3xl bg-white p-5 shadow-wt">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-ink-4 mb-3">Gallery</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {gallery.map((m, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setGalleryIndex(i); setLightboxOpen(true); }}
                    className={`relative aspect-square overflow-hidden rounded-xl border-2 ${i === galleryIndex ? "border-primary-600" : "border-transparent"}`}
                  >
                    <img src={m.media_url} alt={m.caption || `image ${i + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Itinerary */}
          <section className="rounded-3xl bg-white p-6 sm:p-8 shadow-wt-lg border border-ink-7">
            <h2 className="text-2xl font-black text-ink">Your <span className="text-gradient-primary">day-by-day</span> plan</h2>
            <div className="mt-6 space-y-6">
              {tour.itinerary.map(day => (
                <div key={day.day_number} className="flex gap-4 group">
                  <div className="h-10 w-10 shrink-0 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white grid place-items-center font-black shadow-wt-sm group-hover:scale-110 group-hover:-rotate-3 transition-transform">
                    {day.day_number}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-extrabold text-ink">{day.title}</h3>
                    {day.description && <p className="mt-1 text-sm leading-6 text-ink-3">{day.description}</p>}
                    {day.activities.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {day.activities.map(a => (
                          <span key={a} className="rounded-full bg-ink-9 px-3 py-1 text-xs font-semibold text-ink-2">{a}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Inclusions / Exclusions */}
          <div className="grid md:grid-cols-2 gap-6">
            <section className="rounded-3xl bg-white p-6 shadow-wt border border-ink-7">
              <h2 className="font-black text-ink inline-flex items-center gap-2">
                <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-white inline-flex items-center justify-center shadow-wt-sm">
                  <Check className="h-3.5 w-3.5" />
                </span>
                Included
              </h2>
              <ul className="mt-4 space-y-3 text-sm text-ink-2">
                {tour.inclusions.map(x => (
                  <li key={x.text} className="flex gap-2"><Check className="h-4 w-4 text-emerald-600 shrink-0" />{x.text}</li>
                ))}
              </ul>
            </section>
            <section className="rounded-3xl bg-white p-6 shadow-wt border border-ink-7">
              <h2 className="font-black text-ink inline-flex items-center gap-2">
                <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 text-white inline-flex items-center justify-center shadow-wt-sm">
                  <X className="h-3.5 w-3.5" />
                </span>
                Not included
              </h2>
              <ul className="mt-4 space-y-3 text-sm text-ink-2">
                {tour.exclusions.map(x => (
                  <li key={x.text} className="flex gap-2"><span className="text-rose-500">×</span>{x.text}</li>
                ))}
              </ul>
            </section>
          </div>

          {/* Full description */}
          {tour.description && tour.description !== tour.short_description && (
            <section className="rounded-3xl bg-white p-6 sm:p-8 shadow-wt">
              <h2 className="text-xl font-black text-ink">About this tour</h2>
              <p className="mt-3 text-sm leading-7 text-ink-2 whitespace-pre-line">{tour.description}</p>
            </section>
          )}

          {/* Terms & conditions collapsible */}
          {tour.terms_and_conditions && (
            <section className="rounded-3xl bg-white shadow-wt overflow-hidden">
              <button
                type="button"
                onClick={() => setShowTerms(s => !s)}
                className="w-full px-6 py-4 flex items-center justify-between text-left"
              >
                <h2 className="text-base font-extrabold text-ink">Terms & conditions</h2>
                <ChevronRight className={`h-5 w-5 text-ink-3 transition-transform ${showTerms ? "rotate-90" : ""}`} />
              </button>
              {showTerms && (
                <div className="px-6 pb-6 text-sm leading-7 text-ink-2 whitespace-pre-line border-t border-ink-7 pt-4">
                  {tour.terms_and_conditions}
                </div>
              )}
            </section>
          )}

          {/* Contact help */}
          <section className="relative rounded-3xl bg-gradient-to-br from-primary-50 via-white to-accent-50/40 p-6 flex flex-wrap items-center justify-between gap-4 border border-primary-100 overflow-hidden">
            <div aria-hidden className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary-500/10 blur-3xl" />
            <div className="relative">
              <h3 className="text-base font-extrabold text-ink">Need help with this tour?</h3>
              <p className="text-sm text-ink-3">Our team is available 7 days a week.</p>
            </div>
            <div className="relative flex gap-2">
              <a href={telHref(supportPhone)} className="group inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-primary-700 shadow-wt hover:shadow-wt-sm hover:-translate-y-0.5 transition-all">
                <Phone className="h-4 w-4 group-hover:scale-110 transition-transform" /> Call
              </a>
              <Link href="/contact" className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 bg-[length:200%_200%] px-4 py-2 text-sm font-bold text-white shadow-wt-primary hover:bg-[position:100%_0] hover:shadow-wt-glow-primary transition-all">
                <MessageCircle className="h-4 w-4" /> Chat
              </Link>
            </div>
          </section>
        </div>

        {/* ── Right: booking sidebar ─────────────────────── */}
        {/* The sidebar must be a DIRECT grid child for lg:sticky to work —
            wrapping it in MotionGlow (overflow-hidden) created a scroll
            container that silently disabled the sticky behaviour. */}
        <aside className="lg:sticky lg:top-6 self-start rounded-3xl bg-white p-6 shadow-wt-lg border border-ink-7 relative overflow-hidden">
          <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/70 to-transparent" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-gradient-primary">Starting from</p>
              <p className="text-3xl font-black text-ink">
                {INR(tour.starting_price || 0)} <span className="text-sm font-medium text-ink-4">/ package</span>
              </p>
              {perPerson > 0 && (
                <p className="mt-0.5 text-xs font-semibold text-ink-3">
                  ≈ {INR(perPerson)} <span className="font-medium text-ink-4">/ traveller</span>
                </p>
              )}
            </div>
            <span className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white inline-flex items-center justify-center shadow-wt-sm">
              <ShieldCheck className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-4">Travel date</span>
              <input
                type="date"
                min={minDate}
                value={date}
                onChange={e => { setDate(e.target.value); setMessage(""); }}
                className="mt-1 w-full rounded-xl border border-ink-7 px-3 py-3 text-sm focus:border-primary-600 focus:outline-none"
              />
              {endDate && (
                <div className="mt-1.5 flex items-center justify-between rounded-lg bg-ink-8 px-3 py-2 text-xs">
                  <span className="text-ink-4">Trip ends</span>
                  <b className="text-ink">{fmtDay(endDate)}</b>
                </div>
              )}
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-4">Travellers</span>
              <select
                value={pax}
                onChange={e => { setPaxTouched(true); setPax(Number(e.target.value)); }}
                className="mt-1 w-full rounded-xl border border-ink-7 px-3 py-3 text-sm focus:border-primary-600 focus:outline-none"
              >
                {Array.from(
                  { length: tour.maximum_persons ? Math.max(tour.maximum_persons - tour.minimum_persons + 1, 1) : 12 - tour.minimum_persons + 1 },
                  (_, i) => tour.minimum_persons + i
                ).map(n => (
                  <option key={n} value={n}>
                    {n} travellers · {INR(tour.pricing.find(p => p.persons_count >= n)?.package_price || tour.pricing[tour.pricing.length - 1]?.package_price || tour.starting_price || 0)}
                  </option>
                ))}
              </select>
            </label>
            {quote && (
              <div className="rounded-2xl bg-primary-50 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-ink-3">Package total ({pax} travellers)</span>
                  <b className="text-ink">{INR(quote.total_amount)}</b>
                </div>
                {perPerson > 0 && (
                  <div className="mt-1 flex justify-between text-xs text-ink-4">
                    <span>Price per traveller</span>
                    <span>{INR(perPerson)}</span>
                  </div>
                )}
                {quote.commission_percent !== undefined && (
                  <div className="mt-2 flex justify-between text-xs text-ink-4">
                    <span>Platform service & support included</span>
                    <span>{quote.commission_percent}%</span>
                  </div>
                )}
                {date && endDate && (
                  <div className="mt-2 border-t border-primary-100 pt-2 text-xs text-ink-4">
                    {fmtDay(date)} → {fmtDay(endDate)}
                  </div>
                )}
              </div>
            )}
            <button
              disabled={booking}
              onClick={submit}
              className="group w-full rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 bg-[length:200%_200%] py-3.5 text-sm font-extrabold text-white shadow-wt-primary hover:bg-[position:100%_0] hover:shadow-wt-glow-primary disabled:opacity-60 transition-all duration-300 inline-flex items-center justify-center gap-2"
            >
              {booking ? "Creating booking…" : accessToken ? "Review & book" : "Sign in to reserve"}
              {!booking && <ArrowLeft className="h-4 w-4 rotate-180 group-hover:translate-x-0.5 transition-transform" />}
            </button>
            {message && (
              <p className="text-sm rounded-xl p-3 text-rose-700 bg-rose-50">
                {message}
              </p>
            )}
            <p className="text-center text-xs text-ink-4">
              No payment is captured in this step. Admin confirms the itinerary and advance amount next.
            </p>
          </div>
        </aside>
      </div>

      {/* ── Related tours ───────────────────────────────── */}
      {related.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 mt-12">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gradient-primary mb-2">More in {tour.city_name || tour.destination}</p>
          <h2 className="text-2xl sm:text-3xl font-black text-ink tracking-tight">
            Other tours in {tour.city_name || tour.destination}
          </h2>
          <p className="mt-1 text-sm text-ink-3">Explore more packages from this region</p>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {related.map(t => <TourCard key={t.id} tour={t} />)}
          </div>
        </section>
      )}

      {/* ── Mobile sticky book bar ──────────────────────────── */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-7 bg-white/95 backdrop-blur md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-4">Starting from</div>
            <div className="text-lg font-black text-ink">{INR(tour.starting_price || 0)}</div>
          </div>
          <button
            type="button"
            onClick={() => {
              const el = document.querySelector("aside");
              el?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="rounded-full bg-primary-600 px-5 py-2.5 text-sm font-extrabold text-white shadow-wt-primary"
          >
            Reserve now
          </button>
        </div>
      </div>

      {/* ── Lightbox ───────────────────────────────────────── */}
      {lightboxOpen && gallery[galleryIndex] && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setGalleryIndex((galleryIndex - 1 + gallery.length) % gallery.length); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Previous"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <img
            src={gallery[galleryIndex].media_url}
            alt={gallery[galleryIndex].caption || `Image ${galleryIndex + 1}`}
            className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setGalleryIndex((galleryIndex + 1) % gallery.length); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Next"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white">
            {galleryIndex + 1} / {gallery.length}
          </div>
        </div>
      )}

      {/* ── Booking flow modals: auth → profile → review → success ── */}
      <BookingAuthGate
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthenticated={async () => {
          // After auth, check if the profile needs completion (mobile or
          // name — new Google customers have neither). If yes, ask before
          // showing the review so the booking carries a real profile.
          setAuthOpen(false);
          await auth.checkProfileCompletion();
          if (!useAuth.getState().hasCompleteProfile) {
            setProfileOpen(true);
            return;
          }
          setReviewOpen(true);
        }}
        heading="Sign in to reserve your tour"
        subheading="Your traveller details stay attached to the booking."
      />

      <ProfileCompletionModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        initialEmail={user?.email}
        initialMobile={user?.phone}
        initialName={user?.name}
        onComplete={() => {
          setProfileOpen(false);
          setReviewOpen(true);
        }}
      />

      <TourBookingReviewModal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        packageName={tour.package_name}
        destination={tour.destination}
        startDate={date}
        endDate={endDate}
        durationDays={tour.duration_days}
        durationNights={tour.duration_nights}
        pax={pax}
        quote={quote}
        submitting={booking}
        onConfirm={confirmBooking}
      />

      <TourBookingSuccessModal
        open={!!successBooking}
        booking={successBooking}
        packageName={tour.package_name}
        destination={tour.destination}
        startDate={date}
        endDate={endDate}
        pax={pax}
        onViewBookings={() => { setSuccessBooking(null); router.push("/bookings"); }}
        onBrowseMore={() => { setSuccessBooking(null); router.push("/tours"); }}
      />
    </main>
  );
}
