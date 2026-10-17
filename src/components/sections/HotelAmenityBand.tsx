import { Wifi, Snowflake, Car, Tv, Waves, Dumbbell, Coffee, UtensilsCrossed, ConciergeBell, Check } from "lucide-react";
import { Container, Section, SectionHeader } from "@/components/ui";
import { MotionStagger, MotionStaggerItem } from "@/components/ui";
import { API_BASE } from "@/lib/apiBase";
import type { BandTone } from "@/types/cms";

/* ============================================================
   HotelAmenityBand — what the live stays actually provide.

   The list is not a wishlist: it is counted from the amenities attached to
   the hotels the public search returns, and each line says how many of them
   carry it. An amenity that no live hotel offers never appears, so the band
   cannot advertise something a guest would arrive to find missing.

   Doc Ref: public_hotel_api.py (search → amenities), BRD Part 4 §57-92
   ============================================================ */

interface HotelRow {
  id: number;
  amenities: string[];
}

const AMENITY_ICON: Record<string, typeof Wifi> = {
  "free wifi": Wifi,
  wifi: Wifi,
  "air conditioning": Snowflake,
  parking: Car,
  television: Tv,
  "swimming pool": Waves,
  pool: Waves,
  "fitness centre": Dumbbell,
  "gym": Dumbbell,
  "breakfast included": Coffee,
  restaurant: UtensilsCrossed,
  "room service": ConciergeBell,
};

const iconFor = (label: string) => AMENITY_ICON[label.toLowerCase()] ?? Check;

export default async function HotelAmenityBand({
  bg = "muted",
  pad = "tight",
}: {
  bg?: BandTone;
  pad?: "home" | "tight" | "sm" | "md" | "lg";
}) {
  let hotels: HotelRow[] = [];
  try {
    const res = await fetch(`${API_BASE}/public/hotel/search?page_size=20`, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const data = (await res.json()) as { items?: HotelRow[] };
      hotels = data.items ?? [];
    }
  } catch {
    hotels = [];
  }

  const counts = new Map<string, number>();
  for (const h of hotels) {
    for (const a of new Set(h.amenities ?? [])) {
      counts.set(a, (counts.get(a) ?? 0) + 1);
    }
  }
  const rows = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  // Nothing published an amenity → there is no honest list to show.
  if (rows.length === 0) return null;

  const total = hotels.length;

  return (
    <Section bg={bg} pad={pad} id="amenities">
      <Container size="xl">
        <SectionHeader
          eyebrow="What the rooms include"
          title="Amenities on the hotels listed here"
          subtitle={`Counted across the ${total} hotel${total === 1 ? "" : "s"} currently bookable on WayTero — each line says how many of them actually offer it.`}
          accent="primary"
          underline
          animatedEyebrow
          scale="home"
        />

        <MotionStagger className="mt-6 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
          {rows.slice(0, 8).map(([label, n]) => {
            const Icon = iconFor(label);
            return (
              <MotionStaggerItem key={label}>
                <div className="flex items-center gap-3 border-b border-ink-7 py-2">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-600/10 text-primary-700">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink">{label}</span>
                  <span className="shrink-0 text-xs font-semibold text-ink-4">
                    {n} of {total}
                  </span>
                </div>
              </MotionStaggerItem>
            );
          })}
        </MotionStagger>

        <p className="mt-5 text-xs text-ink-4">
          A room&apos;s own list is on that hotel&apos;s page, together with its check-in,
          check-out and cancellation terms, before you pay.
        </p>
      </Container>
    </Section>
  );
}
