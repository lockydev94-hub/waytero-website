"use client";

/**
 * HeroOfferSlider — circular auto-rotating slider for coupon-backed offers,
 * shown in the hero's right column when at least one live offer exists.
 *
 * Each slide links to /offers/{slug}. The circle image rotates every 5s
 * (paused on hover/focus); reduced-motion users get a plain crossfade with
 * no auto-rotation. Badge / coupon code / validity render BELOW the circle
 * (owner wireframe: "slider text show image bottom"). All values are
 * server-derived — nothing here is invented.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Tag } from "lucide-react";
import { MotionTilt, usePrefersReducedMotion } from "@/components/ui";
import type { PublicOfferSlide } from "@/services/publicCms";

const ROTATE_MS = 5000;

const fmtValidTo = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
};

function OfferCircle({ offer }: { offer: PublicOfferSlide }) {
  const [broken, setBroken] = useState(false);
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[220px] xl:max-w-[250px]">
      {/* Soft glow behind the circle */}
      <div
        aria-hidden
        className="absolute -inset-4 rounded-full bg-accent-500/25 blur-3xl animate-pulse-soft"
      />
      {/* Rotating dashed orbit ring */}
      <div
        aria-hidden
        className="absolute -inset-2 rounded-full border-2 border-dashed border-white/25 animate-orbit"
      />
      <div className="absolute inset-0 overflow-hidden rounded-full ring-4 ring-white/30 shadow-wt-xl">
        {broken || !offer.image_url ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-primary-700 via-primary-600 to-accent-500 text-white">
            <Sparkles className="h-10 w-10" />
            <span className="px-6 text-center text-sm font-bold leading-snug">{offer.title}</span>
          </div>
        ) : (
          <Image
            src={offer.image_url}
            alt={offer.title}
            fill
            sizes="(min-width: 1024px) 250px, 70vw"
            className="object-cover"
            onError={() => setBroken(true)}
          />
        )}
      </div>
    </div>
  );
}

export default function HeroOfferSlider({ offers }: { offers: PublicOfferSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = usePrefersReducedMotion();
  const n = offers.length;
  const current = offers[Math.min(index, n - 1)];

  useEffect(() => {
    if (paused || reduced || n <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % n), ROTATE_MS);
    return () => clearInterval(t);
  }, [paused, reduced, n]);

  if (!current) return null;

  return (
    <div
      className="mx-auto flex w-full max-w-sm flex-col items-center gap-2.5 text-center"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] backdrop-blur-md">
        <Sparkles className="h-3 w-3 text-accent-400" aria-hidden /> Live offers
      </span>

      <Link
        href={`/offers/${current.slug}`}
        className="w-full rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
        aria-label={`View offer: ${current.title}`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current.slug}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: reduced ? 0.2 : 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <MotionTilt max={6}>
              <OfferCircle offer={current} />
            </MotionTilt>
            <div className="mt-3 space-y-1">
              <span className="inline-flex items-center rounded-full bg-gradient-to-r from-accent-500 to-accent-600 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white shadow-wt-accent">
                {current.badge}
              </span>
              <div className="text-sm font-extrabold leading-snug text-white drop-shadow-sm">
                {current.title}
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-white/45 bg-white/10 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-white backdrop-blur-md">
                <Tag className="h-3 w-3 text-accent-400" aria-hidden />
                {current.coupon_code}
              </div>
              <div className="text-[11px] font-medium text-white/75">
                Valid till {fmtValidTo(current.valid_to)}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </Link>

      {n > 1 && (
        <div className="flex items-center justify-center gap-2" role="tablist" aria-label="Offer slides">
          {offers.map((o, i) => (
            <button
              key={o.slug}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show offer ${i + 1} of ${n}`}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-6 bg-accent-500" : "w-2 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
