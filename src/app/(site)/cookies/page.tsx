import { Container, PageHeader, Card, Section } from "@/components/ui";
import { publicCmsService, LegalPage } from "@/services/publicCms";
import { pageMetadata, type SeoContent } from "@/services/seoService";
import { BRAND } from "@/lib/brand";

const FALLBACK: SeoContent = {
  title: "Cookie Policy — WayTero",
  description:
    "How WayTero uses cookies and similar technologies on its website and apps.",
  keywords: ["WayTero cookies", "cookie policy India", "travel booking privacy"],
};

export async function generateMetadata(): Promise<import("next").Metadata> {
  return pageMetadata("cookies", "/cookies", FALLBACK);
}

// Static fallback — used only when the backend is unreachable. Dates are
// omitted on purpose: a date the DB doesn't confirm is not shown.
const FALLBACK_PAGE: LegalPage = {
  slug: "cookies",
  title: "Cookie Policy",
  eyebrow: "Legal",
  description: "How WayTero uses cookies and similar technologies on its website and apps.",
  sections: [
    {
      heading: "1. What are cookies?",
      body: "Cookies are small text files stored on your device when you visit a website. They help the site remember you, keep you signed in, and measure how the product is used.",
    },
    {
      heading: "2. Cookies we use",
      body: "Essential cookies — keep you signed in, secure your session, and power the booking flow. These are always on.\nPreference cookies — remember your city, search dates, and display choices.\nAnalytics cookies — help us understand how travelers use the site so we can improve it.\nMarketing cookies — used only with your consent to show relevant travel offers.",
    },
    {
      heading: "3. Managing cookies",
      body: "You can block or delete cookies in your browser settings at any time. Essential cookies cannot be disabled without affecting core features like booking and payments. For details on how we handle your data, see our Privacy Policy (/privacy).",
    },
    {
      heading: "4. Contact",
      body: `Questions about this policy? Email ${BRAND.email}.`,
    },
  ],
};

export default async function CookiesPage() {
  const page = (await publicCmsService.getLegalPage("cookies")) ?? FALLBACK_PAGE;
  const subtitle = [
    page.effective_date ? `Effective ${page.effective_date}` : null,
    page.updated_at ? `Last updated ${page.updated_at}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <Section bg="white" pad="lg" className="bg-gradient-to-br from-primary-50/40 via-white to-white">
        <Container size="md">
          <PageHeader
            eyebrow={page.eyebrow ?? "Legal"}
            title={
              <>
                Cookie <span className="text-gradient-primary">Policy</span>
              </>
            }
            subtitle={subtitle || undefined}
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
                  <p className="whitespace-pre-line">{s.body}</p>
                </div>
              ))}
            </div>
          </Card>
        </Container>
      </Section>
    </>
  );
}
