import { Container, PageHeader, Card } from "@/components/ui";
import { Section } from "@/components/ui";
import { publicCmsService, LegalPage } from "@/services/publicCms";

export const metadata = { title: "Terms of Service", description: "WayTero's terms of service — please read before using the platform." };

// Static fallback — used only when the backend is unreachable.
const FALLBACK: LegalPage = {
  slug: "terms",
  title: "Terms of Service",
  eyebrow: "Legal",
  description: "WayTero's terms of service — please read before using the platform.",
  sections: [
    {
      heading: "1. Service description",
      body: "WayTero is a travel marketplace connecting customers with verified cab drivers, hotels, and tour operators. We facilitate bookings, payments and support; the underlying service is delivered by our partners.",
    },
    {
      heading: "2. Bookings & payments",
      body: "Bookings are confirmed only after payment confirmation (full payment or the advance requested by the partner). Cancellation refunds are governed by our Refund Policy and computed automatically by the cancellation engine based on the tier in effect at the time of the request.",
    },
    {
      heading: "3. Booking instructions",
      body: "Before you book: verify the pickup/drop, dates and passenger count; check the applicable cancellation policy and any advance required; keep your registered mobile reachable. After you book you can track the trip, view invoices, and cancel from the Bookings page. See the Booking Instructions page for the full guide.",
    },
    {
      heading: "4. User conduct",
      body: "You agree to provide accurate booking information, treat partners respectfully, and not misuse the platform for fraudulent activity. WayTero reserves the right to suspend accounts that violate these terms.",
    },
    {
      heading: "5. Liability",
      body: "WayTero acts as an intermediary. Service delivery is the partner's responsibility; we facilitate dispute resolution in good faith.",
    },
    {
      heading: "6. Account deletion",
      body: "You may delete your account via the Account Deletion page. Deletion is irreversible: your login is disabled, wallet balance and loyalty value are forfeited, and personal identifiers are removed.",
    },
    {
      heading: "7. Governing law",
      body: "These terms are governed by the laws of India. Disputes are subject to the jurisdiction of courts in Bhubaneswar, Odisha.",
    },
  ],
};

export default async function TermsPage() {
  const page = (await publicCmsService.getLegalPage("terms")) ?? FALLBACK;
  const subtitle = `Effective ${page.effective_date ?? "January 1, 2026"} · Last updated ${page.updated_at ?? "August 10, 2026"}`;

  return (
    <>
      <Section bg="white" pad="lg" className="bg-gradient-to-br from-primary-50/40 via-white to-white">
        <Container size="md">
          <PageHeader eyebrow={page.eyebrow ?? "Legal"} title={
              <>
                Terms of <span className="text-gradient-primary">Service</span>
              </>
            } subtitle={subtitle} />
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
            </div>
          </Card>
        </Container>
      </Section>
    </>
  );
}
