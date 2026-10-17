import Link from "next/link";
import {
  Building2,
  Clock,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Youtube,
} from "lucide-react";
import {
  Container,
  Section,
  SectionHeader,
  Card,
  IconBox,
  MotionGlow,
  ButtonLink,
} from "@/components/ui";
import { MotionStagger, MotionStaggerItem } from "@/components/ui";
import { CtaSection } from "@/components/renderers";
import PopularRoutesSection from "@/components/renderers/PopularRoutesSection";
import CoverageBand from "@/components/sections/CoverageBand";
import PageFaq, { type FaqItem } from "@/components/sections/PageFaq";
import JsonLd, { faqPageSchema } from "@/components/sections/JsonLd";
import ContactFormCard from "./contact-form";
import publicCmsService from "@/services/publicCms";
import { getAvailability, serviceVisible } from "@/lib/availability";
import { BRAND, waHref } from "@/lib/brand";
import { displayPhone, telHref } from "@/lib/supportPhone";

const SOCIAL_ICONS: Record<string, typeof Facebook> = {
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
};

export default async function ContactPage() {
  // One source of truth for every contact value: system_configurations via
  // /public/platform-profile, with the owner-approved brand master applied
  // inside the service. Rendered on the server, so there is no fallback flash.
  const [profile, av] = await Promise.all([publicCmsService.getPlatformProfile(), getAvailability()]);
  const phone = displayPhone(profile.support_phone);
  const email = profile.support_email || BRAND.email;
  const address = profile.office_address || BRAND.officeAddress;
  const socials = Object.entries(profile.social_links ?? {}).filter(
    ([key, url]) => SOCIAL_ICONS[key] && typeof url === "string" && url.trim() !== "",
  );

  const channels = [
    {
      icon: Phone,
      title: "Phone support",
      value: phone,
      href: telHref(phone),
      desc: "A person picks up — no IVR maze.",
      tone: "primary" as const,
    },
    {
      icon: Mail,
      title: "Email",
      value: email,
      href: `mailto:${email}`,
      desc: "Best for detailed requests and documents.",
      tone: "accent" as const,
    },
    {
      icon: MessageCircle,
      title: "WhatsApp",
      value: phone,
      href: waHref(profile.support_phone),
      desc: "Fastest channel for trip changes.",
      tone: "success" as const,
    },
    {
      icon: Building2,
      title: "Head office",
      value: "Bhubaneswar, Odisha",
      href: undefined,
      desc: address,
      tone: "info" as const,
    },
  ];

  const faqs: FaqItem[] = [
    {
      question: "How fast will someone reply?",
      answer: `Messages sent through this form are answered within 24 hours. The desk is staffed ${BRAND.officeHours}; a call or WhatsApp message sent outside those hours is picked up the next working day.`,
    },
    {
      question: "What's the quickest way to change a booking?",
      answer:
        "Message or call with the booking number ready — it is on your confirmation and in your bookings page. Trip changes are handled from the booking record, so the number is what makes it fast.",
    },
    {
      question: "Can I check a booking without signing in?",
      answer:
        "Yes. The track page takes your booking number and the mobile number it was booked on, and returns the current status — including the driver's name and vehicle number once a partner has accepted.",
    },
    {
      question: "I want to list my hotel, or join with a vehicle.",
      answer:
        "Use the partner page rather than this form — applications are reviewed against your documents, GST where applicable and bank details, and answered within 48 hours.",
    },
    {
      question: "Is there an office I can visit?",
      answer: `Yes — ${address}, ${BRAND.officeHours}. A call or a WhatsApp message before you come means someone can have your booking open when you arrive.`,
    },
  ];

  // The CTA must not point at a vertical whose pages are down. With nothing
  // live there is nothing to send the visitor to, so the band is dropped.
  const cta = serviceVisible(av, "HOTEL")
    ? { label: "Browse hotels", href: "/hotels/results" }
    : serviceVisible(av, "CAB")
      ? { label: "Book a cab", href: "/cabs" }
      : serviceVisible(av, "TOUR")
        ? { label: "Browse tours", href: "/tours" }
        : null;

  return (
    <>
      <JsonLd data={faqPageSchema(faqs)} />

      <Section bg="white" pad="tight">
        <Container size="xl">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary-600 mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-500" aria-hidden />
            We&apos;re here to help
          </p>
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-ink leading-[1.1] tracking-tight">
                Contact <span className="text-gradient-primary">WayTero</span>
              </h1>
              <p className="mt-4 max-w-2xl text-base sm:text-lg text-ink-3 leading-relaxed">
                Phone, WhatsApp and email before, during and after your trip — staffed{" "}
                {BRAND.officeHours}, with form replies inside 24 hours.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <ButtonLink href={telHref(phone)} variant="gradient-primary" size="lg" leftIcon={<Phone className="h-4 w-4" />}>
                  Call {phone}
                </ButtonLink>
                <ButtonLink href={waHref(profile.support_phone)} variant="outline" size="lg" className="border-ink-3/30 text-ink hover:bg-ink-9/40">
                  WhatsApp
                </ButtonLink>
                <ButtonLink href={`mailto:${email}`} variant="outline" size="lg" className="border-ink-3/30 text-ink hover:bg-ink-9/40">
                  Email us
                </ButtonLink>
              </div>
            </div>

            <div className="rounded-3xl border border-ink-7 bg-ink-9/60 p-6">
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink">Before you write</h2>
              <ul className="mt-4 space-y-3 text-sm text-ink-3">
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-primary-600/10 text-[11px] font-extrabold text-primary-700">1</span>
                  Keep your booking number to hand — it is on your confirmation.
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-primary-600/10 text-[11px] font-extrabold text-primary-700">2</span>
                  For a status check, the track page answers instantly, no sign-in.
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-primary-600/10 text-[11px] font-extrabold text-primary-700">3</span>
                  Partner and vehicle applications go through the partner desk.
                </li>
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      <Section bg="muted" pad="tight" overlay="dots-faint">
        <Container size="xl">
          <SectionHeader
            eyebrow="Four ways in"
            title="Pick the channel that fits the question"
            accent="primary"
            underline
            animatedEyebrow
            scale="home"
          />
          <MotionStagger className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {channels.map((c) => {
              const Icon = c.icon;
              const glowColor = ((c.tone as string) === "info" ? "primary" : c.tone) as "primary" | "accent" | "success" | "danger";
              return (
                <MotionStaggerItem key={c.title} className="h-full">
                  <MotionGlow color={glowColor} intensity={0.15} size={320} className="rounded-2xl">
                    <Card variant="premium" hover lift="md" hoverTint="primary" className="group h-full">
                      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <IconBox
                        icon={<Icon />}
                        tone={c.tone}
                        size="md"
                        gradient
                        glow
                        className="mb-3 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300"
                      />
                      <h3 className="text-sm font-bold text-ink mb-1 group-hover:text-primary-700 transition-colors">{c.title}</h3>
                      {c.href ? (
                        <a href={c.href} className="text-gradient-primary text-sm font-semibold mb-1 block hover:opacity-80 transition-opacity">
                          {c.value}
                        </a>
                      ) : (
                        <div className="text-gradient-primary text-sm font-semibold mb-1">{c.value}</div>
                      )}
                      <p className="text-xs text-ink-3 leading-relaxed">{c.desc}</p>
                    </Card>
                  </MotionGlow>
                </MotionStaggerItem>
              );
            })}
          </MotionStagger>

          {socials.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold text-ink-3">
              <span className="uppercase tracking-wide text-ink-4">Elsewhere</span>
              {socials.map(([key, url]) => {
                const Icon = SOCIAL_ICONS[key];
                return (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-ink-2 transition-colors hover:text-primary-700"
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </a>
                );
              })}
            </div>
          )}
        </Container>
      </Section>

      <CoverageBand
        bg="white"
        pad="tight"
        eyebrow="Where we can actually help"
        title="Coverage behind these channels"
        subtitle="Support answers for the places we operate — the cities with live supply on WayTero right now."
      />

      <PopularRoutesSection
        bg="muted"
        pad="tight"
        variant={{
          variant_tag: "Trip questions",
          headline: "Routes people write to us about",
          subheadline: "Most of what reaches this desk is one of these trips — the fare, the timing, or a change of plan.",
        }}
      />

      <Section bg="white" pad="tight" id="form" overlay="dots-faint">
        <Container size="xl">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] gap-8 items-start">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
                Send us a <span className="text-gradient-primary">message</span>
              </h2>
              <p className="mt-3 text-ink-3 max-w-md">
                For non-urgent requests, partnerships or press — fill this in and we&apos;ll come back within 24 hours.
              </p>
              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-3 rounded-2xl border border-ink-7 bg-ink-9/60 p-4">
                  <IconBox icon={<MapPin />} tone="primary" size="md" gradient />
                  <div>
                    <div className="text-sm font-bold text-ink">Head office</div>
                    <div className="text-sm text-ink-3">{address}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-ink-7 bg-ink-9/60 p-4">
                  <IconBox icon={<Clock />} tone="accent" size="md" gradient />
                  <div>
                    <div className="text-sm font-bold text-ink">Office hours</div>
                    <div className="text-sm text-ink-3">{BRAND.officeHours}</div>
                  </div>
                </div>
              </div>
              <p className="mt-5 text-xs text-ink-4">
                Need it now?{" "}
                <Link href="/track" className="font-bold text-primary-700 hover:text-primary-800">
                  Check your booking status
                </Link>
                .
              </p>
            </div>

            <ContactFormCard />
          </div>
        </Container>
      </Section>

      <PageFaq
        faqs={faqs}
        eyebrow="Good to know"
        title="Questions this desk answers most"
        pad="tight"
        overlay="dots-faint"
      />

      {cta && (
        <CtaSection
          variant={{
            title: "Ready when you are",
            subtitle: "Cabs, hotels and tours with upfront, GST-inclusive pricing — and a human on the other end if you need one.",
            cta_text: cta.label,
            cta_link: cta.href,
          }}
          bg="white"
          pad="tight"
          cardSize="compact"
          secondary={{ label: "Track a booking", href: "/track" }}
        />
      )}
    </>
  );
}
