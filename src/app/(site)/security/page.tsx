import { ShieldCheck, Lock, FileCheck, Eye } from "lucide-react";
import {
  Container,
  Section,
  IconBox,
  MotionGlow,
  MotionStagger,
  MotionStaggerItem,
} from "@/components/ui";
import PageHero from "@/components/sections/PageHero";
import ProseBand from "@/components/sections/ProseBand";
import { pageMetadata, type SeoContent } from "@/services/seoService";
import { getDesk } from "@/lib/desk";
import type { LegalSection } from "@/services/publicCms";
import StaticPageSeo from "@/components/sections/StaticPageSeo";

const META_FALLBACK: SeoContent = {
  title: "Security — WayTero",
  description:
    "How WayTero protects your account, your booking data and your money — HTTPS, OTP and Firebase auth, role-gated staff access, and no card numbers on file.",
  keywords: ["WayTero security", "data protection India", "secure travel booking"],
};

export async function generateMetadata(): Promise<import("next").Metadata> {
  return pageMetadata("security", "/security", META_FALLBACK);
}

const TRUST = [
  { icon: Lock, title: "Served over HTTPS", tone: "primary" as const },
  { icon: ShieldCheck, title: "Role-gated staff access", tone: "success" as const },
  { icon: FileCheck, title: "Invoices you can download", tone: "accent" as const },
  { icon: Eye, title: "No card numbers stored", tone: "info" as const },
];

// Not a LEGAL_PAGE_* body: this page describes the running system, so its
// text belongs next to the code that has to keep matching it.
const SECTIONS: LegalSection[] = [
  {
    heading: "1. Account & authentication",
    body: "Customer accounts authenticate via mobile OTP or Firebase (email / Google sign-in), and sessions use short-lived access tokens with automatic refresh. Partners and staff authenticate through separate, role-scoped portals.",
  },
  {
    heading: "2. Data protection",
    body: [
      "• The site is served over HTTPS end to end.",
      "• Online payments are handled by the payment gateway. WayTero keeps the amount, the mode and the receipt reference — never your card number.",
      "• Access to customer data inside WayTero is role-gated, and every staff action on money is recorded against the user who took it.",
    ].join("\n"),
  },
  {
    heading: "3. Platform integrity",
    body: "Bookings are priced server-side, inventory is guarded by database-level oversell checks, and every money movement is recorded in an audit trail. If you believe you have found a security issue, report it to the address below.",
  },
];

export default async function SecurityPage() {
  const desk = await getDesk();

  return (
    <>
      <StaticPageSeo pageKey="security" path="/security" name="Security at WayTero" crumb="Security" />
      <PageHero
        eyebrow="Trust & Safety"
        title="Security at WayTero"
        accent="WayTero"
        description="What protects your account, your booking data, and the money that moves between them."
      />

      <Section bg="muted" pad="tight">
        <Container size="lg">
          <MotionStagger className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {TRUST.map((t) => {
              const Icon = t.icon;
              const glowColor = (t.tone === "info" ? "primary" : t.tone) as
                | "primary"
                | "accent"
                | "success"
                | "danger";
              return (
                <MotionStaggerItem key={t.title} className="h-full">
                  <MotionGlow color={glowColor} intensity={0.15} size={240} className="h-full rounded-2xl">
                    <div className="group h-full rounded-2xl border border-ink-7 bg-white p-5 text-center">
                      <IconBox
                        icon={<Icon />}
                        tone={t.tone}
                        size="md"
                        gradient
                        glow
                        className="mx-auto mb-3 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300"
                      />
                      <div className="text-xs font-bold leading-snug text-ink group-hover:text-primary-700 transition-colors">
                        {t.title}
                      </div>
                    </div>
                  </MotionGlow>
                </MotionStaggerItem>
              );
            })}
          </MotionStagger>
        </Container>
      </Section>

      <ProseBand
        sections={SECTIONS}
        eyebrow="How it is built"
        title="The three protections, in full"
        bg="white"
        id="protections"
        footer={
          <p className="text-sm text-ink-2">
            Reporting a security issue:{" "}
            <a
              href={`mailto:${desk.email}?subject=Security%20issue`}
              className="font-extrabold text-primary-700 hover:text-primary-800"
            >
              {desk.email}
            </a>
          </p>
        }
      />
    </>
  );
}
