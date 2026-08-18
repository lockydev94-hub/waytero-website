import Link from "next/link";
import { Container, PageHeader, Card } from "@/components/ui";
import { Section } from "@/components/ui";
import { publicCmsService, LegalPage } from "@/services/publicCms";

export const metadata = { title: "Booking Instructions", description: "How to book a cab, hotel, or tour package on WayTero." };

// Static fallback — used only when the backend is unreachable.
const FALLBACK: LegalPage = {
  slug: "booking-instructions",
  title: "Booking Instructions",
  eyebrow: "Guide",
  description: "How to book a cab, hotel, or tour package on WayTero.",
  sections: [
    {
      heading: "1. Book a cab",
      body: "Enter pickup and drop, choose the trip type (one-way, round trip, outstation), and pick the vehicle category. A fare estimate is shown before you confirm. If the partner requests an advance, pay it to confirm; the driver receives your trip automatically once assigned. Track your cab live from the Track page.",
    },
    {
      heading: "2. Book a hotel",
      body: "Search by city and dates, filter by price/amenities, and review the hotel's cancellation policy before booking. Confirm with the room category and guest count. Some properties require an advance; the balance is collected at check-in or per the property's terms.",
    },
    {
      heading: "3. Book a tour package",
      body: "Browse tour packages by destination and duration. Check the package's cancellation policy and what is included (transport, stay, meals, activities). Pay the required advance to confirm; the tour operator confirms the booking and the itinerary is available to download.",
    },
    {
      heading: "4. Payments & advances",
      body: "Payments are processed securely by our payment partners. Advances are shown on the booking detail with receipts. The balance due is displayed on every booking; collect and settle through the partner at the time of service.",
    },
    {
      heading: "5. Cancelling a booking",
      body: "You can preview the exact refund before you cancel from the Bookings page. Cancellation rules differ per service (cab ladder, hotel policy, tour policy) and are computed by the engine at the moment you cancel. Refunds credit your wallet instantly.",
    },
    {
      heading: "6. Invoices & support",
      body: "Tax invoices are available for completed trips from the booking detail. For any issue, raise it from the Support page or contact our customer care team.",
    },
  ],
};

export default async function BookingInstructionsPage() {
  const page = (await publicCmsService.getLegalPage("booking-instructions")) ?? FALLBACK;

  return (
    <>
      <Section bg="white" pad="lg" className="bg-gradient-to-br from-primary-50/40 via-white to-white">
        <Container size="md">
          <PageHeader
            eyebrow={page.eyebrow ?? "Guide"}
            title={
              <>
                Booking <span className="text-gradient-primary">Instructions</span>
              </>
            }
            subtitle="Everything you need to know before you book a cab, hotel, or tour package on WayTero."
          />
        </Container>
      </Section>
      <Section bg="grid" pad="md">
        <Container size="md">
          <Card variant="premium" className="prose prose-slate max-w-none group relative">
            <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/70 to-transparent" />
            <div className="space-y-6 text-ink-2 leading-relaxed">
              {page.sections.map((s) => (
                <div key={s.heading}>
                  <h2 className="text-xl font-bold text-ink">{s.heading}</h2>
                  <p>{s.body}</p>
                </div>
              ))}
              <p className="text-sm text-ink-4 pt-2 border-t border-ink-8">
                Prefer a quick start?{" "}
                <Link href="/cabs" className="text-primary-600 font-semibold">Book a cab</Link>
                {" · "}
                <Link href="/hotels" className="text-primary-600 font-semibold">Find hotels</Link>
                {" · "}
                <Link href="/tours" className="text-primary-600 font-semibold">Browse tours</Link>
              </p>
            </div>
          </Card>
        </Container>
      </Section>
    </>
  );
}
