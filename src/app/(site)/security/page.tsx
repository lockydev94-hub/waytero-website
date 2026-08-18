import { ShieldCheck, Lock, FileCheck, Eye } from "lucide-react";
import { Section, Container, IconBox, Card, MotionGlow, MotionStagger, MotionStaggerItem } from "@/components/ui";
import {
  LegalPageHeader,
  LegalBody,
  PolicySection,
  PolicyList,
} from "@/components/static/LegalSection";

export const metadata = {
  title: "Security — WayTero",
  description: "How WayTero protects your data, payments, and account — encryption, auth, and compliance.",
};

const TRUST = [
  { icon: Lock, title: "Encryption in transit & at rest", tone: "primary" as const },
  { icon: ShieldCheck, title: "Role-based access control", tone: "success" as const },
  { icon: FileCheck, title: "GST-compliant invoicing", tone: "accent" as const },
  { icon: Eye, title: "No card numbers stored", tone: "info" as const },
];

export default function SecurityPage() {
  return (
    <>
      <LegalPageHeader
        eyebrow="Trust & Safety"
        title="Security at WayTero"
        meta="Last updated August 10, 2026"
      />
      <Section bg="muted" pad="md" overlay="dots">
        <Container size="md">
          <MotionStagger className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
            {TRUST.map((t, idx) => {
              const Icon = t.icon;
              const glowColor = ((t.tone as string) === "info" ? "primary" : t.tone) as "primary" | "accent" | "success" | "danger";
              return (
                <MotionStaggerItem key={t.title} className="h-full">
                  <MotionGlow color={glowColor} intensity={0.15} size={240} className="h-full rounded-2xl">
                    <Card variant="premium" hover lift="sm" className="group h-full text-center">
                      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <IconBox
                        icon={<Icon />}
                        tone={t.tone}
                        size="md"
                        gradient
                        glow
                        className="mx-auto mb-3 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300"
                      />
                      <div className="text-xs font-bold text-ink leading-snug group-hover:text-primary-700 transition-colors">{t.title}</div>
                    </Card>
                  </MotionGlow>
                </MotionStaggerItem>
              );
            })}
          </MotionStagger>
        </Container>
      </Section>
      <LegalBody>
        <PolicySection heading="1. Account & authentication">
          <p>
            Customer accounts authenticate via mobile OTP or Firebase (email / Google sign-in),
            and sessions use short-lived access tokens with automatic refresh. Partners and
            staff authenticate through separate, role-scoped portals.
          </p>
        </PolicySection>
        <PolicySection heading="2. Data protection">
          <PolicyList
            items={[
              "All data is encrypted in transit (TLS 1.2+) and at rest.",
              "Payment metadata is handled by PCI-DSS compliant processors; we never store card numbers.",
              "Access to customer data is role-gated and audited (see your Privacy Policy rights).",
            ]}
          />
        </PolicySection>
        <PolicySection heading="3. Platform integrity">
          <p>
            Bookings are priced server-side, inventory is guarded by database-level oversell
            checks, and every money movement is recorded in an audit trail. If you believe you've
            found a security issue, report it to{" "}
            <a href="mailto:security@waytero.com" className="text-primary-600 font-semibold">
              security@waytero.com
            </a>
            .
          </p>
        </PolicySection>
      </LegalBody>
    </>
  );
}
