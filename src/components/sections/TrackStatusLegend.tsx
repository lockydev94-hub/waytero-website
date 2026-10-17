import { Car, Check, Hotel, Layers, Map, X } from "lucide-react";
import { Container, Section, SectionHeader, MotionStagger, MotionStaggerItem } from "@/components/ui";
import type { BandTone } from "@/types/cms";

/* ============================================================
   TrackStatusLegend — what the lookup actually answers.

   The list below is the payload of GET /public/bookings/track, field by
   field (booking/services/booking_lookup.py → public_leads_api.py). It is
   printed next to the form so nobody submits a booking number expecting a
   map: this endpoint returns a status and the people involved, not a GPS
   position, and the driver's mobile arrives masked.
   ============================================================ */

const VERTICALS = [
  {
    icon: Car,
    name: "Cab booking",
    shows: [
      "Status, from awaiting assignment to completed",
      "Pickup and drop, trip type, pickup date and time",
      "Driver name, vehicle number and a masked mobile once one is assigned",
    ],
    missing: "No live vehicle position, no route playback, no ETA clock.",
  },
  {
    icon: Hotel,
    name: "Hotel reservation",
    shows: [
      "Status, including awaiting hotel confirmation",
      "Property name and address",
      "Check-in and check-out dates, rooms and guests",
    ],
    missing: "No room number or housekeeping state — that stays at the desk.",
  },
  {
    icon: Map,
    name: "Tour package",
    shows: [
      "Status and the amount on the booking",
      "Package name and destination",
      "Travel dates, day and night count, travellers",
    ],
    missing: "No day-by-day itinerary feed and no pickup alerts here.",
  },
  {
    icon: Layers,
    name: "Complete trip",
    shows: [
      "Which services sit inside the trip",
      "Journey start and end dates",
      "The master booking number you searched",
    ],
    missing: "Not the per-service detail — search each service's own number for that.",
  },
];

export default function TrackStatusLegend({
  bg = "muted",
  pad = "tight",
  eyebrow = "Before you search",
  title = "What each booking answers",
  subtitle = "The lookup is a status check, not a tracking map. Here is exactly what comes back for each kind of booking — and what does not.",
}: {
  bg?: BandTone;
  pad?: "home" | "tight" | "sm" | "md" | "lg";
  eyebrow?: string;
  title?: string;
  subtitle?: string;
}) {
  // Cards take the opposite light step to the band, or they vanish into it.
  const cardTone = bg === "white" ? "border-ink-7 bg-ink-9/60" : "border-ink-7 bg-white";

  return (
    <Section bg={bg} pad={pad} id="what-you-see" overlay="dots-faint">
      <Container size="xl">
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          accent="primary"
          underline
          animatedEyebrow
          scale={pad === "home" || pad === "tight" ? "home" : "default"}
        />

        <MotionStagger className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VERTICALS.map((v) => {
            const Icon = v.icon;
            return (
              <MotionStaggerItem key={v.name} className="h-full">
                <div className={`flex h-full flex-col rounded-2xl border p-5 ${cardTone}`}>
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 text-white shadow-wt-sm">
                      <Icon className="h-[17px] w-[17px]" />
                    </span>
                    <span className="text-sm font-extrabold text-ink">{v.name}</span>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {v.shows.map((s) => (
                      <li key={s} className="flex items-start gap-2 text-[13px] leading-relaxed text-ink-2">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success-600" aria-hidden />
                        {s}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-auto flex items-start gap-2 pt-4 text-[12px] leading-relaxed text-ink-4">
                    <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" aria-hidden />
                    {v.missing}
                  </p>
                </div>
              </MotionStaggerItem>
            );
          })}
        </MotionStagger>

        <p className="mt-5 text-xs leading-relaxed text-ink-4">
          A booking number only opens with the mobile it was made on. A wrong mobile returns the same
          &ldquo;not found&rdquo; as a wrong number, so this page cannot be used to probe someone
          else&rsquo;s trip — and the driver&rsquo;s number is masked for the same reason.
        </p>
      </Container>
    </Section>
  );
}
