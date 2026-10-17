import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  LifeBuoy,
  MessageSquareWarning,
  Phone,
  RotateCcw,
} from "lucide-react";
import {
  Container,
  Section,
  SectionHeader,
  IconBox,
  MotionGlow,
} from "@/components/ui";
import { MotionStagger, MotionStaggerItem } from "@/components/ui";
import { CtaSection } from "@/components/renderers";
import TrackStatusLegend from "@/components/sections/TrackStatusLegend";
import TrackLookup from "./track-lookup";
import publicCmsService from "@/services/publicCms";
import { getAvailability, serviceVisible } from "@/lib/availability";
import { BRAND, waHref } from "@/lib/brand";
import { displayPhone, telHref } from "@/lib/supportPhone";

export default async function TrackPage() {
  const [profile, av] = await Promise.all([publicCmsService.getPlatformProfile(), getAvailability()]);
  const phone = displayPhone(profile.support_phone);

  const cta = serviceVisible(av, "HOTEL")
    ? { label: "Browse hotels", href: "/hotels/results" }
    : serviceVisible(av, "CAB")
      ? { label: "Book a cab", href: "/cabs" }
      : serviceVisible(av, "TOUR")
        ? { label: "Browse tours", href: "/tours" }
        : null;

  const help: {
    icon: typeof CalendarClock;
    title: string;
    desc: string;
    tone: "primary" | "accent" | "info";
    link?: { label: string; href: string };
  }[] = [
    {
      icon: CalendarClock,
      title: "No driver assigned yet",
      desc: "A booking sits in this state until a partner accepts it. That is normal — you get the driver's name, vehicle number and contact here the moment one is assigned.",
      tone: "primary" as const,
    },
    {
      icon: RotateCcw,
      title: "Need to change or cancel",
      desc: "The ladder that decides what comes back is published, and it runs on how much notice you give. Read it before you cancel, not after.",
      tone: "accent" as const,
      link: { label: "Refund & cancellation terms", href: "/refund" },
    },
    {
      icon: MessageSquareWarning,
      title: "Something went wrong on the trip",
      desc: "Tell us what happened with the booking number and we can pull it up. The desk is staffed the hours shown on the contact page.",
      tone: "info" as const,
      link: { label: "Contact support", href: "/contact" },
    },
  ];

  return (
    <>
      <Section bg="white" pad="tight" className="bg-gradient-to-br from-primary-50/60 via-white to-white">
        <Container size="md">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary-600 mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-500" aria-hidden />
            Booking status lookup
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-ink leading-[1.1] tracking-tight">
            Track your <span className="text-gradient-primary">booking</span>
          </h1>
          <p className="mt-3 max-w-xl text-base text-ink-3 leading-relaxed">
            Enter a booking number and the mobile it was made on. You get the status, the driver or
            property on the booking, the dates and the amount — no sign-in needed.
          </p>

          <TrackLookup />
        </Container>
      </Section>

      <TrackStatusLegend bg="muted" pad="tight" />

      <Section bg="white" pad="tight" overlay="dots-faint">
        <Container size="lg">
          <SectionHeader
            eyebrow="If the status isn't enough"
            title="What to do next"
            accent="primary"
            underline
            animatedEyebrow
            scale="home"
          />
          <MotionStagger className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            {help.map((h) => {
              const Icon = h.icon;
              const glowColor = ((h.tone as string) === "info" ? "primary" : h.tone) as "primary" | "accent" | "success" | "danger";
              return (
                <MotionStaggerItem key={h.title} className="h-full">
                  <MotionGlow color={glowColor} intensity={0.16} size={260} className="h-full rounded-2xl">
                    <div className="flex h-full flex-col rounded-2xl border border-ink-7 bg-ink-9/60 p-5">
                      <IconBox icon={<Icon />} tone={h.tone} size="md" gradient />
                      <h3 className="mt-4 text-sm font-extrabold text-ink">{h.title}</h3>
                      <p className="mt-2 text-[13px] leading-relaxed text-ink-3">{h.desc}</p>
                      {h.link && (
                        <Link
                          href={h.link.href}
                          className="mt-auto inline-flex items-center gap-1 pt-4 text-xs font-extrabold text-primary-700 transition-colors hover:text-primary-800"
                        >
                          {h.link.label}
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                        </Link>
                      )}
                    </div>
                  </MotionGlow>
                </MotionStaggerItem>
              );
            })}
          </MotionStagger>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 rounded-2xl border border-ink-7 bg-ink-9/60 px-5 py-4">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ink-4">
              <LifeBuoy className="h-3.5 w-3.5 text-primary-600" aria-hidden />
              A person answers, not a menu
            </span>
            <a href={telHref(phone)} className="inline-flex items-center gap-1.5 text-xs font-extrabold text-primary-700 hover:text-primary-800">
              <Phone className="h-3.5 w-3.5" aria-hidden />
              {phone}
            </a>
            <a href={waHref(profile.support_phone)} className="text-xs font-extrabold text-primary-700 hover:text-primary-800">
              WhatsApp us
            </a>
            <span className="text-xs font-semibold text-ink-4">{BRAND.officeHours}</span>
          </div>
        </Container>
      </Section>

      {cta && (
        <CtaSection
          variant={{
            title: "Everything in order?",
            subtitle: "When you are ready for the next trip, the same account books cabs, hotels and tours.",
            cta_text: cta.label,
            cta_link: cta.href,
          }}
          bg="muted"
          pad="tight"
          cardSize="compact"
        />
      )}
    </>
  );
}
