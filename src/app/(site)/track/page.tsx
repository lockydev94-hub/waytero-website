"use client";

import { useState } from "react";
import { useSupportPhone } from "@/hooks/useSupportPhone";
import { telHref } from "@/lib/supportPhone";
import { Search, MapPin, Phone, MessageCircle, Car, Hotel, Map, Loader2, User, Navigation, CalendarDays, IndianRupee } from "lucide-react";
import { Container, Section, PageHeader, Card, Input, Button, Badge, MotionGlow, MotionStagger, MotionStaggerItem, IconBox } from "@/components/ui";
import { publicLeadsService, TrackedBooking } from "@/services/publicLeads";

const STATUS_TONE: Record<string, "warning" | "info" | "success" | "danger" | "primary" | "neutral"> = {
  PENDING_ASSIGNMENT: "warning",
  PENDING_PARTNER_ACCEPTANCE: "warning",
  ASSIGNED: "primary",
  ACCEPTED: "primary",
  STARTED: "info",
  COMPLETED: "success",
  SETTLEMENT_PENDING: "success",
  SETTLED: "success",
  CANCELLED: "danger",
  NO_SHOW: "danger",
  PENDING_PAYMENT: "warning",
  AWAITING_HOTEL_CONFIRMATION: "warning",
  CONFIRMED: "primary",
  CHECKED_IN: "info",
  IN_HOUSE: "info",
  CHECKED_OUT: "success",
  REJECTED: "danger",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING_ASSIGNMENT: "Awaiting driver assignment",
  PENDING_PARTNER_ACCEPTANCE: "Driver being assigned",
  ASSIGNED: "Driver assigned",
  ACCEPTED: "Trip accepted",
  STARTED: "On the way / trip in progress",
  COMPLETED: "Trip completed",
  SETTLEMENT_PENDING: "Trip completed",
  SETTLED: "Trip completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "Marked no-show",
  PENDING_PAYMENT: "Awaiting payment",
  AWAITING_HOTEL_CONFIRMATION: "Awaiting hotel confirmation",
  CONFIRMED: "Reservation confirmed",
  CHECKED_IN: "Checked in",
  IN_HOUSE: "In-house",
  CHECKED_OUT: "Checked out",
  REJECTED: "Reservation rejected",
};

export default function TrackPage() {
  const supportPhone = useSupportPhone();
  const [bookingNumber, setBookingNumber] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
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

  const tone = result ? STATUS_TONE[result.status] ?? "neutral" : "neutral";
  const label = result ? STATUS_LABEL[result.status] ?? result.status : "";

  return (
    <Section bg="white" pad="lg" className="bg-gradient-to-br from-primary-50/60 via-white to-white min-h-[calc(100vh-200px)]">
      <Container size="md">
        <PageHeader
          eyebrow="Live booking tracker"
          title={
            <>
              Track your <span className="text-gradient-primary">booking</span>
            </>
          }
          subtitle="Enter your booking number to see real-time status — cab location, hotel check-in, or tour itinerary."
        />

        <MotionGlow color="primary" intensity={0.12} size={500} className="mt-10 rounded-3xl">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Mobile number" type="tel" required placeholder="Registered mobile"
                value={mobile} onChange={(e) => setMobile(e.target.value)} maxLength={10} />
              <Input label="Email" type="email" placeholder="Registered email (optional)"
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {error && (
              <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger" role="alert">{error}</p>
            )}
            <Button type="submit" variant="gradient-primary" size="lg" fullWidth leftIcon={searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} disabled={searching} shine>
              {searching ? "Looking up…" : "Track booking"}
            </Button>
          </form>
        </Card>
        </MotionGlow>

        {result && (
          <Card variant="premium" className="mt-6 overflow-hidden group relative">
            <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/70 to-transparent" />
            <div className="flex items-center justify-between gap-3 border-b border-ink-7 px-6 py-4 bg-gradient-to-r from-primary-50/40 via-white to-accent-50/30">
              <div>
                <div className="flex items-center gap-2">
                  {result.service_type === "CAB" ? <Car className="h-4 w-4 text-primary-600" /> : <Hotel className="h-4 w-4 text-primary-600" />}
                  <span className="text-sm font-bold text-ink uppercase tracking-wider">
                    {result.service_type === "CAB" ? "Cab booking" : "Hotel booking"}
                  </span>
                </div>
                <p className="mt-1 font-mono text-sm text-ink-2">{result.booking_number}</p>
              </div>
              <Badge tone={tone}>{label}</Badge>
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
                        <a href={`tel:${result.driver.mobile}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600">
                          <Phone className="h-3.5 w-3.5" /> {result.driver.mobile}
                        </a>
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

              {result.amount > 0 && (
                <div className="flex items-start gap-3">
                  <IndianRupee className="h-4 w-4 mt-0.5 text-success-600" />
                  <div className="font-semibold text-ink">₹{result.amount.toLocaleString("en-IN")}</div>
                </div>
              )}
            </div>
          </Card>
        )}

        <MotionStagger className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { tone: "primary" as const, icon: <Car className="h-3 w-3" />, label: "Cabs", title: "Live cab tracking", desc: "Driver location, ETA, and route — share with family." },
            { tone: "accent" as const, icon: <Hotel className="h-3 w-3" />, label: "Hotels", title: "Hotel reservation", desc: "Check-in time, room status, and special requests." },
            { tone: "success" as const, icon: <Map className="h-3 w-3" />, label: "Tours", title: "Tour itinerary", desc: "Pickup notifications and day-by-day updates." },
          ].map((c) => (
            <MotionStaggerItem key={c.title} className="h-full">
              <Card variant="premium" hover lift="sm" className="group h-full text-center">
                <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="inline-flex"><Badge tone={c.tone} icon={c.icon}>{c.label}</Badge></div>
                <h3 className="font-bold text-ink mt-3 mb-1 group-hover:text-primary-700 transition-colors">{c.title}</h3>
                <p className="text-sm text-ink-3 leading-relaxed">{c.desc}</p>
              </Card>
            </MotionStaggerItem>
          ))}
        </MotionStagger>

        <div className="mt-10 text-center text-sm text-ink-3">
          Need help? <a href="/contact" className="text-primary-600 font-semibold">Contact support</a> or <a href={telHref(supportPhone)} className="text-primary-600 font-semibold">call {supportPhone}</a>.
        </div>
      </Container>
    </Section>
  );
}
