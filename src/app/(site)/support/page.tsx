import {
  Car, Hotel, Map, Undo2, Search, ClipboardList, Phone, Mail, MessageCircle,
} from "lucide-react";
import {
  Container, Section, SectionHeader, Card, IconBox, ButtonLink,
  MotionStagger, MotionStaggerItem, MotionGlow,
} from "@/components/ui";
import PageHero, { HeroAside } from "@/components/sections/PageHero";
import ProseBand from "@/components/sections/ProseBand";
import PageFaq from "@/components/sections/PageFaq";
import JsonLd, { faqPageSchema } from "@/components/sections/JsonLd";
import { getPageBody, resolvePage, sourceNote } from "@/lib/pageBody";
import { getDesk } from "@/lib/desk";
import { PAGE_BODIES } from "@/content/pageBodies";
import type { BandTone } from "@/types/cms";
import { pageMetadata, type SeoContent } from "@/services/seoService";

const META_FALLBACK: SeoContent = {
  title: "Support — WayTero",
  description:
    "How to reach the WayTero desk, what to have ready, and where each kind of booking question is actually answered.",
  keywords: ["WayTero support", "booking help", "cancellation help", "travel help India"],
};

export async function generateMetadata(): Promise<import("next").Metadata> {
  return pageMetadata("support", "/support", META_FALLBACK);
}

/* ============================================================
   /support — the triage page.

   It used to open with a search box over help articles that do not exist
   (there is no articles table), and to promise "24/7 human support" and
   "instant refunds" next to a contact page that said Mon–Sat. What is here
   now: where a question is really answered, the prose an admin owns, the
   live answers from that body, and the channels — closing on them, because
   a visitor who reaches the end of the answers is the one who needs a human.
   ============================================================ */

const ROUTES = [
  {
    icon: Car,
    title: "Cab booking",
    desc: "Pickup, fare, driver assignment, trip changes.",
    href: "/cabs",
    action: "Book or rebook",
    tone: "primary" as const,
  },
  {
    icon: Hotel,
    title: "Hotel stay",
    desc: "Check-in dates, room requests, the property's own cancellation rules.",
    href: "/hotels",
    action: "Browse stays",
    tone: "success" as const,
  },
  {
    icon: Map,
    title: "Tour package",
    desc: "Itinerary, inclusions, travellers and travel dates.",
    href: "/tours",
    action: "See packages",
    tone: "accent" as const,
  },
  {
    icon: Search,
    title: "Where is my booking?",
    desc: "Status, and the driver, vehicle and masked mobile once one is assigned.",
    href: "/track",
    action: "Track by number",
    tone: "info" as const,
  },
  {
    icon: Undo2,
    title: "Cancel or refund",
    desc: "The live ladders, the refund preview, and where the money lands.",
    href: "/refund",
    action: "Read the tiers",
    tone: "primary" as const,
  },
  {
    icon: ClipboardList,
    title: "After you book",
    desc: "Payment stages, receipts, invoices and what the driver or property tells you.",
    href: "/booking-instructions",
    action: "What happens next",
    tone: "success" as const,
  },
];

function SupportRoutes() {
  return (
    <Section bg="muted" pad="tight" id="topics" overlay="dots-faint">
      <Container size="lg">
        <SectionHeader
          eyebrow="Start here"
          title="Where each question is answered"
          subtitle="Six routes cover almost everything people contact us about. The booking number is what makes any of them fast."
          accent="primary"
          underline
          animatedEyebrow
          scale="home"
        />
        <MotionStagger className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ROUTES.map((c) => {
            const Icon = c.icon;
            const glow = (c.tone === "info" ? "primary" : c.tone) as
              | "primary" | "accent" | "success" | "danger";
            return (
              <MotionStaggerItem key={c.title} className="h-full">
                <MotionGlow color={glow} intensity={0.15} size={260} className="h-full rounded-2xl">
                  <Card variant="premium" hover lift="md" hoverTint="primary" className="group h-full">
                    <IconBox
                      icon={<Icon />}
                      tone={c.tone}
                      size="md"
                      gradient
                      glow
                      className="mb-4 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300"
                    />
                    <h3 className="font-bold text-ink mb-1.5 group-hover:text-primary-700 transition-colors">
                      {c.title}
                    </h3>
                    <p className="text-sm text-ink-3 leading-relaxed">{c.desc}</p>
                    <a
                      href={c.href}
                      className="mt-4 inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-primary-700 transition-colors hover:text-primary-800"
                    >
                      {c.action}
                    </a>
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

/** The closer: three channels, all read from the platform profile. WhatsApp is
 *  its own number only when the admin has entered one; the desk helper falls
 *  back to the support line, so this band never shows a dead prefix. */
async function TalkToHuman({ bg }: { bg: BandTone }) {
  const desk = await getDesk();
  // The href is the only place the WhatsApp number is composed (admin's own
  // digits, else the support line), so the display is read back off it rather
  // than guessed at here.
  const waNumber = desk.whatsapp.replace(/^https?:\/\/wa\.me\//, "");
  const CHANNELS = [
    {
      icon: Phone,
      title: "Call",
      value: desk.phone,
      href: desk.tel,
      desc: "Fastest while the desk is staffed.",
      tone: "primary" as const,
    },
    {
      icon: MessageCircle,
      title: "WhatsApp",
      value: waNumber ? `+${waNumber}` : desk.phone,
      href: desk.whatsapp,
      desc: "Trip changes, photos, anything you are typing on the move.",
      tone: "success" as const,
    },
    {
      icon: Mail,
      title: "Email",
      value: desk.email,
      href: `mailto:${desk.email}?subject=Booking%20help`,
      desc: "Invoices, documents and anything that needs a paper trail.",
      tone: "accent" as const,
    },
  ];
  return (
    <Section bg={bg} pad="tight" id="contact" overlay="grid-faint">
      <Container size="lg">
        <div className="rounded-3xl border border-ink-7 bg-gradient-to-br from-ink via-ink-800 to-primary-900 text-white px-7 py-8 lg:px-10 lg:py-10 relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary-500/25 blur-3xl" />
          <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          <div className="relative">
            <h2 className="text-xl lg:text-2xl font-extrabold tracking-tight">Still need a person?</h2>
            <p className="mt-1.5 text-sm text-white/75 max-w-2xl leading-relaxed">
              The desk is staffed {desk.hours}. A message that arrives while someone is on is
              answered the same working day; anything else waits for the next one. Keep the booking
              number handy — it is what turns a question into an answer.
            </p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {CHANNELS.map((c) => {
                const Icon = c.icon;
                return (
                  <a
                    key={c.title}
                    href={c.href}
                    target={c.icon === MessageCircle ? "_blank" : undefined}
                    rel={c.icon === MessageCircle ? "noopener noreferrer" : undefined}
                    className="group rounded-2xl border border-white/15 bg-white/5 p-4 transition-colors hover:border-white/35 hover:bg-white/10"
                  >
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                      <Icon className="h-4.5 w-4.5 text-white" aria-hidden />
                    </span>
                    <p className="mt-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/60">
                      {c.title}
                    </p>
                    <p className="mt-1 font-bold text-white break-words">{c.value}</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/65">{c.desc}</p>
                  </a>
                );
              })}
            </div>
            <div className="mt-6">
              <ButtonLink href="/contact" variant="ghost" size="md" className="text-white border-white/25 hover:bg-white/10">
                Contact form &amp; office address
              </ButtonLink>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

export default async function SupportPage() {
  const [state, desk] = await Promise.all([getPageBody("support"), getDesk()]);
  const page = resolvePage(state, PAGE_BODIES.support);

  return (
    <>
      {page.faq.length > 0 && <JsonLd data={faqPageSchema(page.faq)} />}

      <PageHero
        eyebrow={page.eyebrow ?? "Help"}
        title={page.title}
        description={page.description}
        meta={page.meta}
        side={
          <HeroAside title="Have this ready before you write">
            <ul className="space-y-3 text-sm">
              <li>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-primary-600">
                  Booking number
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-2">
                  On your confirmation and in My Bookings. It opens the status, who is assigned,
                  what was paid and what is refundable.
                </p>
              </li>
              <li>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-primary-600">
                  What happened, and when
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-2">
                  A time and a place turn &ldquo;the cab never came&rdquo; into something the desk
                  can check against the assignment record.
                </p>
              </li>
              <li>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-primary-600">
                  The amount in question
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-2">
                  From the fare breakdown or the invoice, so a refund query is settled in one reply.
                </p>
              </li>
            </ul>
            <p className="mt-4 border-t border-ink-7 pt-3 text-xs leading-relaxed text-ink-3">
              Desk hours: {desk.hours}
            </p>
          </HeroAside>
        }
      />

      <SupportRoutes />

      <ProseBand
        sections={page.sections}
        eyebrow="How the desk works"
        title="Triage, in plain words"
        bg="white"
        overlay="dots-faint"
        source={sourceNote(page.source)}
        footer={
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-ink-4">Related</span>
            {[
              { href: "/refund", label: "Cancellation & refunds" },
              { href: "/safety", label: "Safety" },
              { href: "/account-deletion", label: "Delete an account" },
              { href: "/contact", label: "Contact details" },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-xs font-extrabold text-primary-700 transition-colors hover:text-primary-800"
              >
                {l.label}
              </a>
            ))}
          </div>
        }
      />

      {page.faq.length > 0 && (
        <PageFaq
          faqs={page.faq}
          eyebrow="Popular questions"
          title="What people ask most"
          pad="tight"
          overlay="dots-faint"
        />
      )}

      <TalkToHuman bg={page.faq.length > 0 ? "white" : "muted"} />
    </>
  );
}
