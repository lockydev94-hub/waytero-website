import { Container, PageHeader, Card } from "@/components/ui";
import { Section } from "@/components/ui";
import { publicCmsService, LegalPage } from "@/services/publicCms";

export const metadata = { title: "Privacy Policy", description: "WayTero's privacy policy — how we collect, use, and protect your data." };

// Static fallback — used only when the backend is unreachable. The seeded
// content from GET /public/legal/privacy (single source of truth) wins.
const FALLBACK: LegalPage = {
  slug: "privacy",
  title: "Privacy Policy",
  eyebrow: "Legal",
  description: "WayTero's privacy policy — how we collect, use, and protect your data.",
  sections: [
    {
      heading: "1. Data we collect",
      body: "WayTero Travel Technologies Pvt Ltd (\"WayTero\", \"we\", \"us\") collects only the data needed to deliver your travel services: account information (name, email, mobile number), trip information (pickup, drop, dates, passengers), payment metadata (card numbers are never stored by us), and device/usage logs used for fraud prevention and product improvement.",
    },
    {
      heading: "2. How we use your data",
      body: "We use your data to operate the platform, match you with verified partners, process payments and refunds, send booking updates, and prevent abuse. We do not sell your personal data.",
    },
    {
      heading: "3. Sharing with partners",
      body: "We share only the minimum trip information required for the relevant partner to deliver your booking. All partners are bound by data-processing agreements.",
    },
    {
      heading: "4. Account deletion",
      body: "You may request deletion of your account at any time from the Account Deletion page. Requests are reviewed by our team and processed within 30 days. On deletion, your login is disabled and personal identifiers are removed; booking and financial records are retained in anonymised form as required by law.",
    },
    {
      heading: "5. Your rights",
      body: "You can request an export of your data, correction, or deletion by raising an account deletion request or emailing privacy@waytero.com. We respond within 30 days.",
    },
    {
      heading: "6. Security",
      body: "All data is encrypted in transit (TLS 1.2+) and at rest. Authentication uses email (Firebase) or mobile OTP with platform-managed JWTs.",
    },
  ],
};

export default async function PrivacyPage() {
  const page = (await publicCmsService.getLegalPage("privacy")) ?? FALLBACK;
  const subtitle = `Effective ${page.effective_date ?? "January 1, 2026"} · Last updated ${page.updated_at ?? "August 10, 2026"}`;

  return (
    <>
      <Section bg="white" pad="lg" className="bg-gradient-to-br from-primary-50/40 via-white to-white">
        <Container size="md">
          <PageHeader eyebrow={page.eyebrow ?? "Legal"} title={
              <>
                {page.title.split(" ")[0]}{" "}
                <span className="text-gradient-primary">{page.title.split(" ").slice(1).join(" ")}</span>
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
              <p className="text-sm text-ink-4 pt-2 border-t border-ink-8">
                Want to delete your account?{" "}
                <a href="/account-deletion" className="text-primary-600 font-semibold">
                  Request account deletion
                </a>
              </p>
            </div>
          </Card>
        </Container>
      </Section>
    </>
  );
}
