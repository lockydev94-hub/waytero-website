/**
 * SupportSection — building blocks for the /support help center page.
 * Each export is a self-contained section; the page composes them.
 */

import { Phone, Mail, MessageCircle, Car, Hotel, Map, Wallet, CreditCard, ShieldCheck, Search } from "lucide-react";
import { Container, Section, PageHeader, SectionHeader, IconBox, Card, ButtonLink, MotionGlow, MotionStagger, MotionStaggerItem } from "@/components/ui";
import FaqAccordion, { type FaqItem } from "@/components/static/FaqAccordion";
import { publicCmsService } from "@/services/publicCms";
import { displayPhone, telHref } from "@/lib/supportPhone";

// ── Hero ────────────────────────────────────────────────────────────────
export function SupportHero() {
  return (
    <Section bg="white" pad="lg" className="bg-gradient-to-br from-primary-50/60 via-white to-primary-50/30 relative overflow-hidden" overlay="dots">
      <div aria-hidden className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary-100/40 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-accent-100/30 blur-3xl" />
      <Container size="lg" className="relative">
        <PageHeader
          eyebrow="Help Center"
          title={
            <>
              How can we <span className="text-gradient-primary">help?</span>
            </>
          }
          subtitle="Answers for cabs, hotels, tours, payments, and refunds — plus 24/7 human support when you need it."
        />
        <div className="mt-8 max-w-xl mx-auto">
          <div className="relative group">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-4 group-focus-within:text-primary-600 transition-colors" />
            <input
              type="search"
              placeholder="Search help articles… e.g. cancel a hotel booking"
              className="w-full h-14 rounded-2xl border border-ink-7 bg-white pl-12 pr-4 text-sm py-3.5 shadow-wt focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-500 transition-all hover:shadow-wt-lg hover:-translate-y-0.5"
            />
          </div>
        </div>
      </Container>
    </Section>
  );
}

// ── Help categories ─────────────────────────────────────────────────────
const CATEGORIES = [
  { icon: Car, title: "Cab bookings", desc: "Pickups, fares, cancellations, and trip changes.", tone: "primary" as const },
  { icon: Hotel, title: "Hotel bookings", desc: "Check-in, room requests, and stay modifications.", tone: "success" as const },
  { icon: Map, title: "Tours & packages", desc: "Itineraries, inclusions, and custom tours.", tone: "accent" as const },
  { icon: Wallet, title: "Wallet & refunds", desc: "Balance, instant refunds, and settlements.", tone: "info" as const },
  { icon: CreditCard, title: "Payments", desc: "Payment methods, invoices, and GST receipts.", tone: "primary" as const },
  { icon: ShieldCheck, title: "Safety & trust", desc: "Verified partners, ratings, and dispute help.", tone: "accent" as const },
];

export function HelpCategoryGrid() {
  return (
    <Section bg="white" pad="lg" overlay="dots">
      <Container size="lg">
        <SectionHeader eyebrow="Browse topics" title="What do you need help with?" accent="primary" underline animatedEyebrow />
        <MotionStagger className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const glowColor = ((c.tone === "info" ? "primary" : c.tone) as "primary" | "accent" | "success" | "danger");
            return (
              <MotionStaggerItem key={c.title} className="h-full">
                <MotionGlow color={glowColor} intensity={0.15} size={260} className="h-full rounded-2xl">
                  <Card variant="premium" hover lift="md" hoverTint="primary" className="group h-full">
                    <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <IconBox icon={<Icon />} tone={c.tone} size="md" gradient glow className="mb-4 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300" />
                    <h3 className="font-bold text-ink mb-1.5 group-hover:text-primary-700 transition-colors">{c.title}</h3>
                    <p className="text-sm text-ink-3">{c.desc}</p>
                  </Card>
                </MotionGlow>
              </MotionStaggerItem>
            );
          })}
        </MotionStagger>
      </Container>
    </Section>
  );
}

// ── FAQ ─────────────────────────────────────────────────────────────────
const FAQ_ITEMS: FaqItem[] = [
  {
    question: "How do I cancel a hotel booking and get a refund?",
    answer: "Open your booking from the 'My Bookings' page and choose Cancel. Refunds follow the hotel's cancellation policy shown at booking time — free cancellation within the hotel's window, then tiered refunds. Approved refunds credit to your WayTero wallet instantly.",
  },
  {
    question: "Why is my quoted price different from the room's listed price?",
    answer: "The per-night price you see on the hotel page reflects the rate in force for your exact dates (rate plans and seasonal offers are applied automatically). The checkout breakdown shows every night, taxes, and the final payable amount — that's what you pay.",
  },
  {
    question: "How do I change my check-in date after booking?",
    answer: "Contact support before the hotel's change window closes. Date changes are subject to availability and the rate difference; call us on 8480889870 for the fastest help.",
  },
  {
    question: "When will my refund appear in my wallet?",
    answer: "Approved cancellations credit instantly to your WayTero wallet. You can use the balance for any future booking or request a bank transfer (1-3 business days).",
  },
  {
    question: "How do I get a GST invoice for my booking?",
    answer: "Tax invoices are auto-generated for eligible bookings. Find 'Invoice' under the booking details in My Bookings, or email support@waytero.com with your booking number.",
  },
];

export async function SupportFaq() {
  const supportPhone = displayPhone(await publicCmsService.getSupportPhone());
  // Keep the FAQ answer's phone in sync with the admin-configured number.
  const items = FAQ_ITEMS.map((item) =>
    item.answer.includes("8480889870")
      ? { ...item, answer: item.answer.replace("8480889870", supportPhone) }
      : item,
  );
  return (
    <FaqAccordion
      id="faq"
      items={items}
      eyebrow="Popular questions"
      title="Frequently asked questions"
      subtitle="The answers travelers ask us most."
    />
  );
}

// ── Contact channels (module-level static channels moved into SupportChannels) ──

export async function SupportChannels() {
  const supportPhone = displayPhone(await publicCmsService.getSupportPhone());
  const CHANNELS = [
    { icon: Phone, title: "Call us", value: supportPhone, href: telHref(supportPhone), desc: "24/7. Real humans, no IVR maze.", tone: "primary" as const },
    { icon: MessageCircle, title: "WhatsApp", value: "+91 90000 00001", href: undefined, desc: "Fastest for trip changes while traveling.", tone: "success" as const },
    { icon: Mail, title: "Email", value: "support@waytero.com", href: undefined, desc: "We reply within 4 hours, day or night.", tone: "accent" as const },
  ];
  return (
    <Section bg="muted" pad="lg" overlay="grid">
      <Container size="lg">
        <SectionHeader
          eyebrow="Still stuck?"
          title="Talk to a human"
          subtitle="Reach us on any channel — we don't clock out."
          accent="primary"
          underline
          animatedEyebrow
        />
        <MotionStagger className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
          {CHANNELS.map((c) => {
            const Icon = c.icon;
            const glowColor = (c.tone as "primary" | "accent" | "success" | "danger");
            return (
              <MotionStaggerItem key={c.title} className="h-full">
                <MotionGlow color={glowColor} intensity={0.15} size={260} className="h-full rounded-2xl">
                  <Card variant="premium" hover lift="md" hoverTint="primary" className="group text-center h-full">
                    <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="inline-flex">
                      <IconBox icon={<Icon />} tone={c.tone} size="lg" gradient glow className="group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300" />
                    </div>
                    <h3 className="font-bold text-ink mt-4 mb-1 group-hover:text-primary-700 transition-colors">{c.title}</h3>
                    {c.href ? (
                      <a href={c.href} className="text-primary-600 font-bold text-sm mb-1.5 block hover:opacity-80 transition-opacity">{c.value}</a>
                    ) : (
                      <div className="text-primary-600 font-bold text-sm mb-1.5">{c.value}</div>
                    )}
                    <p className="text-xs text-ink-3">{c.desc}</p>
                  </Card>
                </MotionGlow>
              </MotionStaggerItem>
            );
          })}
        </MotionStagger>
      </Container>
    </Section>
  );
}
