import Link from "next/link";
import { ArrowRight, ClipboardList, Search, Wallet } from "lucide-react";
import PageHero, { HeroAside } from "@/components/sections/PageHero";
import ProseBand from "@/components/sections/ProseBand";
import CancellationFactsBand from "@/components/sections/CancellationFactsBand";
import PageFaq from "@/components/sections/PageFaq";
import JsonLd, { faqPageSchema } from "@/components/sections/JsonLd";
import { CtaSection } from "@/components/renderers";
import { getPageBody, resolvePage, sourceNote } from "@/lib/pageBody";
import { PAGE_BODIES } from "@/content/pageBodies";
import publicCmsService, { type LiveCancellationPolicy } from "@/services/publicCms";
import { pageMetadata, type SeoContent } from "@/services/seoService";
import StaticPageSeo from "@/components/sections/StaticPageSeo";

const META_FALLBACK: SeoContent = {
  title: "Refund & Cancellation Policy — WayTero",
  description:
    "How a WayTero refund is calculated, when it is credited, and what it can be used for.",
  keywords: ["refund policy", "cancellation policy", "WayTero", "travel booking India"],
};

export async function generateMetadata(): Promise<import("next").Metadata> {
  return pageMetadata("refund", "/refund", META_FALLBACK);
}

/** Every number here comes from the live ladder, so an admin moving a tier in
 *  Settings moves this answer with it. With no payload the numeric questions
 *  drop out and only the un-numbered ones are asked. */
function refundFaqs(policy: LiveCancellationPolicy | null) {
  const generic = [
    {
      question: "Where does a refund go?",
      answer:
        "There is no separate payout. A refund is credited to your WayTero wallet as part of processing the cancellation, and you can spend it on any future booking. WayTero does not offer a withdrawal from the wallet to a bank account today, so the wallet is the form a refund takes.",
    },
    {
      question: "Can a refund be more than I paid?",
      answer:
        "No. Every refund is capped at the advance actually paid on that booking, and nothing is charged on top of it.",
    },
    {
      question: "Can I see the amount before I cancel?",
      answer:
        "Yes. Open the booking in My Bookings and choose Cancel — the preview shows the cancellation charge and the refund before you confirm. Once you confirm, that is the amount that is processed.",
    },
    {
      question: "What about a hotel booking?",
      answer:
        "Each hotel sets its own cancellation ladder, so there is no platform-wide hotel table. The policy that applies to your stay is shown on the hotel page before you book and again in the refund preview before you cancel.",
    },
  ];
  if (!policy) return generic;

  const cab = policy.cab;
  const tour = policy.tour;
  return [
    {
      question: "How much do I get back if I cancel a cab?",
      answer: `Cancelling ${cab.free_hours} or more hours before pickup costs you nothing — the full advance is refunded. Between ${cab.tier_1_hours} and ${cab.free_hours} hours you get ${cab.tier_1_percent}% back, between ${cab.tier_2_hours} and ${cab.tier_1_hours} hours ${cab.tier_2_percent}%, and less than ${cab.tier_2_hours} hours before pickup the advance is not refunded. After a driver has been assigned, ${cab.after_assignment_percent}% is refunded however close to pickup you cancel.`,
    },
    {
      question: "How much do I get back if I cancel a tour package?",
      answer: `${tour.tier_1_percent}% is refunded from ${tour.free_days} days out, ${tour.tier_2_percent}% between ${tour.tier_1_days} and ${tour.free_days} days, ${tour.tier_3_percent}% between ${tour.tier_2_days} and ${tour.tier_1_days} days, and ${tour.last_minute_percent}% inside ${tour.tier_2_days} days of the travel start date. Some packages carry their own policy instead — the package page says which ladder applies.`,
    },
    ...generic,
  ];
}

const STEPS = [
  {
    icon: ClipboardList,
    label: "Open the booking in My Bookings",
    href: "/bookings",
  },
  {
    icon: Search,
    label: "Press Cancel and read the refund preview",
    href: "/bookings",
  },
  {
    icon: Wallet,
    label: "Check the credit in your wallet history",
    href: "/wallet",
  },
];

export default async function RefundPage() {
  const [state, policy] = await Promise.all([
    getPageBody("refund"),
    publicCmsService.getCancellationPolicy(),
  ]);
  const page = resolvePage(state, PAGE_BODIES.refund);
  const faqs = refundFaqs(policy);

  return (
    <>
      <StaticPageSeo pageKey="refund" path="/refund" name="Cancellation & Refund Policy" crumb="Refund" />
      <JsonLd data={faqPageSchema(faqs)} />

      <PageHero
        eyebrow={page.eyebrow ?? "Policy"}
        title={page.title}
        accent="Cancellation"
        description={page.description}
        meta={page.meta}
        side={
          <HeroAside title="How to cancel">
            <ol className="space-y-3 text-sm">
              {STEPS.map((s, i) => (
                <li key={s.label} className="flex items-start gap-3">
                  <span
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 text-[11px] font-black text-white"
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  <Link
                    href={s.href}
                    className="font-bold text-ink-2 transition-colors hover:text-primary-700"
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ol>
            <p className="mt-4 border-t border-ink-7 pt-3 text-xs leading-relaxed text-ink-3">
              Already cancelled?{" "}
              <Link
                href="/track"
                className="inline-flex items-center gap-1 font-extrabold text-primary-700 hover:text-primary-800"
              >
                Check the booking status
                <ArrowRight className="h-3 w-3" aria-hidden />
              </Link>
            </p>
          </HeroAside>
        }
      />

      <CancellationFactsBand
        bg="muted"
        id="ladder"
        eyebrow="The tiers in force"
        title="What you get back, by when"
        subtitle="Read straight from the platform's own policy settings, so this is the ladder the cancellation engine uses — not a summary of it."
        showPolicyLink={false}
      />

      <ProseBand
        sections={page.sections}
        bg="white"
        overlay="dots-faint"
        source={sourceNote(page.source)}
        footer={
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-ink-4">
              Read these too
            </span>
            {[
              { href: "/booking-instructions", label: "What to expect after booking" },
              { href: "/terms", label: "Terms of service" },
              { href: "/privacy", label: "Privacy policy" },
              { href: "/contact", label: "Talk to the desk" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-xs font-extrabold text-primary-700 transition-colors hover:text-primary-800"
              >
                {l.label}
              </Link>
            ))}
          </div>
        }
      />

      <PageFaq
        faqs={faqs}
        eyebrow="Refund questions"
        title="What people ask before they cancel"
        pad="tight"
        overlay="dots-faint"
      />

      <CtaSection
        variant={{
          headline: "Book with the numbers already published",
          subtitle:
            "The ladder on this page is the ladder the cancellation engine applies — read it before you pay, not after.",
          cta_text: "Browse hotels",
          cta_link: "/hotels/results",
        }}
        bg="white"
        pad="tight"
        cardSize="compact"
        secondary={{ label: "Track a booking", href: "/track" }}
      />
    </>
  );
}
