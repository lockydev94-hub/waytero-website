import { Car, Clock, ShieldCheck, Wallet, MapPin } from "lucide-react";
import { Container, PageHeader, IconBox, MotionGlow, Card } from "@/components/ui";
import { Section, SectionHeader } from "@/components/ui";
import { MotionStagger, MotionStaggerItem } from "@/components/ui";
import { PopularDestinationsSection, CtaSection } from "@/components/renderers";
import CabSearchForm from "@/components/sections/CabSearchForm";

// ── Page-level SEO (SSR) — DB-driven with static fallback ────────────────
// Reads the CAB service type's seo_title/seo_description/seo_keywords from
// the backend (Settings → Service Types); falls back to bundled static
// values when the admin hasn't filled them in or the API is unreachable.
import type { Metadata } from "next";
import { resolveSeo, toMetadata, getServiceTypeSeo } from "@/services/seoService";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await resolveSeo("CAB");
  return toMetadata(seo, "/cabs");
}

const FEATURES = [
  { icon: Clock, title: "60-sec booking", desc: "Outstation or local — book in under a minute.", tone: "primary" as const },
  { icon: ShieldCheck, title: "Verified drivers", desc: "Background-checked, trained, ID-on-file.", tone: "success" as const },
  { icon: Wallet, title: "No surge pricing", desc: "Upfront fare. What you see is what you pay.", tone: "accent" as const },
  { icon: MapPin, title: "Live tracking", desc: "Share trip with family. Track in real-time.", tone: "info" as const },
];

export default async function CabsPage() {
  // Hero/banner image configured by the admin (Settings → Service Types → CAB).
  const serviceSeo = await getServiceTypeSeo();
  const cabImage = serviceSeo.CAB?.image_url ?? null;

  return (
    <>
      <Section bg="white" pad="lg" className="bg-gradient-to-b from-primary-50/60 via-white to-white">
        <Container size="lg">
          <PageHeader
            eyebrow="Outstation & Local Rides"
            title={
              <>
                Book a cab <span className={cabImage ? "text-accent-400" : "text-primary-600"}>in 60 seconds</span>
              </>
            }
            subtitle="Reliable cabs across India — outstation, airport transfers, and local rides. Verified drivers, transparent pricing, real-time tracking."
            imageUrl={cabImage ?? undefined}
          />
          <div className="mt-10">
            <CabSearchForm variant="page" />
          </div>
        </Container>
      </Section>

      <Section bg="muted" pad="md" overlay="dots">
        <Container size="lg">
          <SectionHeader
            eyebrow="Why book cabs with WayTero"
            title="A better cab experience"
            accent="primary"
            underline
            animatedEyebrow
          />
          <MotionStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              const glowColor = ((f.tone as string) === "info" ? "primary" : f.tone) as "primary" | "accent" | "success" | "danger";
              return (
                <MotionStaggerItem key={f.title} className="h-full">
                  <MotionGlow color={glowColor} intensity={0.18} size={260} className="h-full rounded-2xl">
                    <Card variant="premium" hover lift="md" hoverTint="primary" className="group h-full">
                      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <IconBox
                        icon={<Icon />}
                        tone={f.tone}
                        size="md"
                        glow
                        className="mb-4 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300"
                      />
                      <h3 className="font-bold text-ink mb-1.5 group-hover:text-primary-700 transition-colors">
                        {f.title}
                      </h3>
                      <p className="text-sm text-ink-3 leading-relaxed">{f.desc}</p>
                    </Card>
                  </MotionGlow>
                </MotionStaggerItem>
              );
            })}
          </MotionStagger>
        </Container>
      </Section>

      <PopularDestinationsSection variant={{ eyebrow: "Top outstation routes", subtitle: "Most-booked cab routes this season." }} />
      <CtaSection variant={{ title: "Ready to ride?", subtitle: "Your next journey is one tap away.", primary_cta: { label: "Book a Cab", href: "/cabs" } }} />
    </>
  );
}
