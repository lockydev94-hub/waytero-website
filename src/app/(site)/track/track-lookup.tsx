"use client";

import { useState, type ReactElement } from "react";
import {
  CalendarDays,
  Car,
  Hotel,
  IndianRupee,
  Layers,
  Loader2,
  Map,
  MapPin,
  Navigation,
  Phone,
  Search,
  User,
  Users,
} from "lucide-react";
import { Badge, Button, Card, Input, MotionGlow } from "@/components/ui";
import { publicLeadsService, type TrackedBooking } from "@/services/publicLeads";
import { statusLabel, statusTone } from "@/lib/bookingStatus";

// The tracker answers one of four shapes: a single-service CAB / HOTEL / TOUR
// booking, or TRIP when the number typed was the master (complete-trip) one.
const SERVICE_META: Record<string, { label: string; icon: ReactElement }> = {
  CAB: { label: "Cab booking", icon: <Car className="h-4 w-4 text-primary-600" /> },
  HOTEL: { label: "Hotel booking", icon: <Hotel className="h-4 w-4 text-primary-600" /> },
  TOUR: { label: "Tour booking", icon: <Map className="h-4 w-4 text-primary-600" /> },
  TRIP: { label: "Complete trip", icon: <Layers className="h-4 w-4 text-primary-600" /> },
};

export default function TrackLookup() {
  const [bookingNumber, setBookingNumber] = useState("");
  const [mobile, setMobile] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrackedBooking | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    setError(null);
    setResult(null);
    try {
      const res = await publicLeadsService.trackBooking(bookingNumber.trim(), mobile.trim());
      setResult(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Booking not found. Please check your details.");
    } finally {
      setSearching(false);
    }
  };

  const meta = result ? SERVICE_META[result.service_type] ?? SERVICE_META.TRIP : null;

  return (
    <>
      <MotionGlow color="primary" intensity={0.12} size={500} className="mt-6 rounded-3xl">
        <Card variant="premium" className="group relative">
          <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/70 to-transparent" />
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Booking number"
              required
              placeholder="e.g. WT-2025-AB123CD"
              value={bookingNumber}
              onChange={(e) => setBookingNumber(e.target.value)}
            />
            <Input
              label="Registered mobile"
              type="tel"
              required
              placeholder="The 10-digit number the booking was made on"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              maxLength={10}
            />
            {error && (
              <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger" role="alert">{error}</p>
            )}
            <Button type="submit" variant="gradient-primary" size="lg" fullWidth leftIcon={searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} disabled={searching} shine>
              {searching ? "Looking up…" : "Track booking"}
            </Button>
          </form>
        </Card>
      </MotionGlow>

      {result && meta && (
        <Card variant="premium" className="mt-4 overflow-hidden group relative">
          <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/70 to-transparent" />
          <div className="flex items-center justify-between gap-3 border-b border-ink-7 px-6 py-4 bg-gradient-to-r from-primary-50/40 via-white to-accent-50/30">
            <div>
              <div className="flex items-center gap-2">
                {meta.icon}
                <span className="text-sm font-bold text-ink uppercase tracking-wider">{meta.label}</span>
              </div>
              <p className="mt-1 font-mono text-sm text-ink-2">{result.booking_number}</p>
            </div>
            <Badge tone={statusTone(result.status)}>{statusLabel(result.status)}</Badge>
          </div>

          <div className="px-6 py-5 space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 mt-0.5 text-ink-4" />
              <div>
                <div className="font-semibold text-ink">{result.customer_name}</div>
                <div className="text-ink-3">Passenger</div>
              </div>
            </div>

            {result.service_type === "CAB" && result.trip && (
              <>
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 mt-0.5 text-primary-600" />
                  <div>
                    <div className="font-semibold text-ink">{result.trip.pickup_location}</div>
                    <div className="text-ink-3">{result.trip.trip_type} trip</div>
                  </div>
                </div>
                {result.trip.drop_location && (
                  <div className="flex items-start gap-3">
                    <Navigation className="h-4 w-4 mt-0.5 text-accent-500" />
                    <div>
                      <div className="font-semibold text-ink">{result.trip.drop_location}</div>
                      <div className="text-ink-3">Drop</div>
                    </div>
                  </div>
                )}
                {result.trip.pickup_datetime && (
                  <div className="flex items-start gap-3">
                    <CalendarDays className="h-4 w-4 mt-0.5 text-ink-4" />
                    <div className="text-ink-2">
                      {new Date(result.trip.pickup_datetime).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </div>
                  </div>
                )}
                {result.driver && (
                  <div className="rounded-xl bg-primary-50/70 border border-primary-100 p-4 space-y-1.5">
                    <div className="flex items-center gap-2 font-semibold text-ink">
                      <Car className="h-4 w-4 text-primary-600" /> Driver: {result.driver.name ?? "Assigned"}
                    </div>
                    {result.driver.vehicle_number && (
                      <div className="text-ink-3 font-mono">Vehicle: {result.driver.vehicle_number}</div>
                    )}
                    {result.driver.mobile && (
                      <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600">
                        <Phone className="h-3.5 w-3.5" /> {result.driver.mobile}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {result.service_type === "HOTEL" && result.stay && (
              <>
                <div className="flex items-start gap-3">
                  <Hotel className="h-4 w-4 mt-0.5 text-primary-600" />
                  <div>
                    <div className="font-semibold text-ink">{result.stay.hotel_name}</div>
                    {result.stay.hotel_address && <div className="text-ink-3">{result.stay.hotel_address}</div>}
                  </div>
                </div>
                {result.stay.check_in_date && (
                  <div className="flex items-start gap-3">
                    <CalendarDays className="h-4 w-4 mt-0.5 text-ink-4" />
                    <div className="text-ink-2">
                      {result.stay.check_in_date} → {result.stay.check_out_date}
                      {result.stay.num_rooms ? ` · ${result.stay.num_rooms} room(s)` : ""}
                      {result.stay.num_guests ? ` · ${result.stay.num_guests} guest(s)` : ""}
                    </div>
                  </div>
                )}
              </>
            )}

            {result.service_type === "TOUR" && result.tour && (
              <>
                <div className="flex items-start gap-3">
                  <Map className="h-4 w-4 mt-0.5 text-primary-600" />
                  <div>
                    <div className="font-semibold text-ink">{result.tour.package_name}</div>
                    {result.tour.destination && (
                      <div className="text-ink-3">{result.tour.destination}</div>
                    )}
                  </div>
                </div>
                {result.tour.travel_start_date && (
                  <div className="flex items-start gap-3">
                    <CalendarDays className="h-4 w-4 mt-0.5 text-ink-4" />
                    <div className="text-ink-2">
                      {result.tour.travel_start_date} → {result.tour.travel_end_date}
                      {result.tour.duration_days ? ` · ${result.tour.duration_days} day(s)` : ""}
                      {result.tour.duration_nights ? ` / ${result.tour.duration_nights} night(s)` : ""}
                    </div>
                  </div>
                )}
                {result.tour.persons_count ? (
                  <div className="flex items-start gap-3">
                    <Users className="h-4 w-4 mt-0.5 text-ink-4" />
                    <div className="text-ink-2">{result.tour.persons_count} traveller(s)</div>
                  </div>
                ) : null}
              </>
            )}

            {result.service_type === "TRIP" && result.trip && (
              <>
                {result.trip.service_types && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {result.trip.service_types.split(",").filter(Boolean).map((t) => (
                      <Badge key={t} tone="primary">
                        {t.charAt(0) + t.slice(1).toLowerCase()}
                      </Badge>
                    ))}
                  </div>
                )}
                {result.trip.journey_start_date && (
                  <div className="flex items-start gap-3">
                    <CalendarDays className="h-4 w-4 mt-0.5 text-ink-4" />
                    <div className="text-ink-2">
                      {result.trip.journey_start_date}
                      {result.trip.journey_end_date ? ` → ${result.trip.journey_end_date}` : ""}
                    </div>
                  </div>
                )}
              </>
            )}

            {result.amount > 0 && (
              <div className="flex items-start gap-3">
                <IndianRupee className="h-4 w-4 mt-0.5 text-success-600" />
                <div className="font-semibold text-ink">₹{result.amount.toLocaleString("en-IN")}</div>
              </div>
            )}
          </div>
        </Card>
      )}
    </>
  );
}
