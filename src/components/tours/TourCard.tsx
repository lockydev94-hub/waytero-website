"use client";

/**
 * TourCard — Reusable tour package card used on the listing page
 * and the related-tours strip on the detail page.
 *
 * Doc Ref: BRD_PART_5_TOUR_PACKAGE_MANAGEMENT §6
 */

import Link from "next/link";
import Image from "next/image";
import { Clock3, MapPin, Users, Sparkles, Tag } from "lucide-react";
import { PublicTourPackage } from "@/services/tourService";

const INR = (n: number) =>
  `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const TYPE_LABEL: Record<string, string> = {
  FIXED: "Fixed Departure",
  PRIVATE: "Private",
  GROUP: "Group Tour",
  PILGRIMAGE: "Pilgrimage",
  CORPORATE: "Corporate",
};

export default function TourCard({ tour }: { tour: PublicTourPackage }) {
  const hero =
    tour.primary_image_url ||
    tour.media.find(m => m.is_primary)?.media_url ||
    tour.media[0]?.media_url;

  const typeLabel = TYPE_LABEL[tour.package_type] || tour.package_type;

  return (
    <Link
      href={`/tours/${tour.slug}`}
      className="group block overflow-hidden rounded-3xl bg-white shadow-wt transition-all hover:-translate-y-1 hover:shadow-wt-lg"
    >
      {/* Hero image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-ink-9">
        {hero ? (
          <Image
            src={hero}
            alt={tour.package_name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-800 to-accent-900">
            <MapPin className="h-12 w-12 text-white/30" />
          </div>
        )}

        {/* Top-left badges */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {tour.package_type && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-600 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-wt-primary">
              <Tag className="h-3 w-3" /> {typeLabel}
            </span>
          )}
        </div>

        {/* Bottom-left duration */}
        <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
          <Clock3 className="h-3 w-3 text-accent-300" />
          {tour.duration_days}D / {tour.duration_nights}N
        </div>

        {tour.partner_name && (
          <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-extrabold text-ink shadow">
            <Sparkles className="h-3 w-3 text-accent-500" />
            {tour.partner_name.length > 16 ? tour.partner_name.slice(0, 16) + "…" : tour.partner_name}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="line-clamp-1 text-base font-extrabold text-ink group-hover:text-primary-600 transition-colors">
          {tour.package_name}
        </h3>

        <div className="mt-2 space-y-1.5 text-xs text-ink-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-4" />
            <span className="line-clamp-1">{tour.destination}{tour.city_name ? `, ${tour.city_name}` : ""}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 shrink-0 text-ink-4" />
            <span>{tour.minimum_persons}–{tour.maximum_persons || "∞"} travellers</span>
          </div>
        </div>

        {tour.short_description && (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-3">
            {tour.short_description}
          </p>
        )}

        <div className="mt-3 flex items-end justify-between gap-2 border-t border-ink-7 pt-3">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-4">Starting from</div>
            <div className="whitespace-nowrap text-lg font-black text-ink">
              {INR(tour.starting_price || 0)}
              <span className="ml-1 text-xs font-medium text-ink-4">/ package</span>
            </div>
          </div>
          <div className="shrink-0 whitespace-nowrap rounded-full bg-primary-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-primary-700 group-hover:bg-primary-100 transition-colors">
            View details →
          </div>
        </div>
      </div>
    </Link>
  );
}