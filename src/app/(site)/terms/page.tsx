import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PageHero from "@/components/sections/PageHero";
import ProseBand from "@/components/sections/ProseBand";
import { getPageBody, resolvePage, sourceNote } from "@/lib/pageBody";
import { PAGE_BODIES } from "@/content/pageBodies";
import { pageMetadata, type SeoContent } from "@/services/seoService";

const META_FALLBACK: SeoContent = {
  title: "Terms of Service — WayTero",
  description:
    "The agreement between you and WayTero: how a booking is confirmed, what you pay, and what happens when you cancel.",
  keywords: ["WayTero terms", "terms of service India", "travel marketplace terms"],
};

export async function generateMetadata(): Promise<import("next").Metadata> {
  return pageMetadata("terms", "/terms", META_FALLBACK);
}

export default async function TermsPage() {
  const page = resolvePage(await getPageBody("terms"), PAGE_BODIES.terms);

  return (
    <>
      <PageHero
        eyebrow={page.eyebrow ?? "Legal"}
        title={page.title}
        accent="of Service"
        description={page.description}
        meta={page.meta}
      />

      <ProseBand
        sections={page.sections}
        eyebrow="The agreement"
        title="What you are signing up to"
        bg="muted"
        source={sourceNote(page.source)}
        footer={
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-ink-4">
              Read with
            </span>
            {[
              { href: "/refund", label: "Refund & cancellation policy" },
              { href: "/booking-instructions", label: "Booking instructions" },
              { href: "/privacy", label: "Privacy policy" },
              { href: "/cookies", label: "Cookies & storage" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="group inline-flex items-center gap-1 text-xs font-extrabold text-primary-700 transition-colors hover:text-primary-800"
              >
                {l.label}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            ))}
          </div>
        }
      />
    </>
  );
}
