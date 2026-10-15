import { Search, CreditCard, Headset, MapPinned } from "lucide-react";
import { Container, Section, SectionHeader, MotionStagger, MotionStaggerItem } from "@/components/ui";

// ============================================================
// LandingSteps — "how it works", 3 steps. service_type picks the
// vocabulary; the copy is honest about what the platform does.
// ============================================================

const STEPS: Record<string, { icon: typeof Search; title: string; text: string }[]> = {
  CAB: [
    { icon: Search, title: "Pick your route", text: "Choose a trip type and see the fare for your vehicle before you book." },
    { icon: CreditCard, title: "Confirm upfront", text: "Base fare, per-km rate and GST are shown itemised — no surprise meters." },
    { icon: Headset, title: "Ride & relax", text: "A verified driver picks you up on time, with support a tap away." },
  ],
  HOTEL: [
    { icon: Search, title: "Compare stays", text: "Browse verified hotels with real photos, ratings and nightly prices." },
    { icon: CreditCard, title: "Book transparently", text: "See the room's cancellation policy and full total before you pay." },
    { icon: Headset, title: "Check in", text: "Your booking confirmation and on-trip support live in the app." },
  ],
  TOUR: [
    { icon: MapPinned, title: "Find a package", text: "Curated multi-day tours with day-by-day itineraries and clear inclusions." },
    { icon: CreditCard, title: "Reserve your seat", text: "Pay a transparent price per traveller — itemised, taxes shown." },
    { icon: Headset, title: "Travel supported", text: "Guides, transport and 24×7 assistance are handled for you." },
  ],
  DEFAULT: [
    { icon: Search, title: "Search real supply", text: "Every price on WayTero comes from live partner inventory, not estimates." },
    { icon: CreditCard, title: "Book upfront", text: "See the full total — including GST — before you commit." },
    { icon: Headset, title: "Supported throughout", text: "Human help from booking to checkout, on every trip." },
  ],
};

export default function LandingSteps({
  title,
  serviceType,
}: {
  title?: string | null;
  serviceType?: string | null;
}) {
  const steps = STEPS[serviceType ?? ""] ?? STEPS.DEFAULT;

  return (
    <Section bg="muted" pad="md">
      <Container size="xl">
        <SectionHeader
          eyebrow="How it works"
          title={title ?? "Booking with WayTero"}
          align="center"
        />
        <MotionStagger className="mt-8 grid gap-5 sm:grid-cols-3">
          {steps.map((s, i) => (
            <MotionStaggerItem key={i}>
              <div className="relative h-full rounded-2xl border border-ink-7 bg-white p-6">
                <span className="absolute -top-3 left-6 flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-sm font-extrabold text-white shadow-wt-primary">
                  {i + 1}
                </span>
                <s.icon className="mt-2 h-7 w-7 text-accent-500" />
                <h3 className="mt-3 text-base font-bold text-ink">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-4">{s.text}</p>
              </div>
            </MotionStaggerItem>
          ))}
        </MotionStagger>
      </Container>
    </Section>
  );
}
