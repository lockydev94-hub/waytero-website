import Link from "next/link";
import { ArrowRight, FileText, Wallet, XOctagon } from "lucide-react";
import PageHero, { HeroAside } from "@/components/sections/PageHero";
import ProseBand from "@/components/sections/ProseBand";
import { getPageBody, resolvePage, sourceNote } from "@/lib/pageBody";
import { PAGE_BODIES } from "@/content/pageBodies";
import { pageMetadata, type SeoContent } from "@/services/seoService";
import StaticPageSeo from "@/components/sections/StaticPageSeo";

const META_FALLBACK: SeoContent = {
  title: "Privacy Policy — WayTero",
  description:
    "What WayTero holds about you, who sees your booking, and how to have the account removed.",
  keywords: ["WayTero privacy", "data protection India", "travel app privacy"],
};

export async function generateMetadata(): Promise<import("next").Metadata> {
  return pageMetadata("privacy", "/privacy", META_FALLBACK);
}

export default async function PrivacyPage() {
  const page = resolvePage(await getPageBody("privacy"), PAGE_BODIES.privacy);

  return (
    <>
      <StaticPageSeo pageKey="privacy" path="/privacy" name="Privacy Policy" crumb="Privacy" />
      <PageHero
        eyebrow={page.eyebrow ?? "Legal"}
        title={page.title}
        accent="Policy"
        description={page.description}
        meta={page.meta}
        side={
          <HeroAside title="What you can do right now">
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/profile"
                  className="group flex items-center gap-2 font-bold text-ink-2 hover:text-primary-700"
                >
                  <FileText className="h-4 w-4 shrink-0 text-primary-600" aria-hidden />
                  Correct your own details in Profile
                  <ArrowRight
                    className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100"
                    aria-hidden
                  />
                </Link>
              </li>
              <li>
                <Link
                  href="/wallet"
                  className="group flex items-center gap-2 font-bold text-ink-2 hover:text-primary-700"
                >
                  <Wallet className="h-4 w-4 shrink-0 text-primary-600" aria-hidden />
                  See your invoices, receipts and wallet
                  <ArrowRight
                    className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100"
                    aria-hidden
                  />
                </Link>
              </li>
              <li>
                <Link
                  href="/account-deletion"
                  className="group flex items-center gap-2 font-bold text-ink-2 hover:text-primary-700"
                >
                  <XOctagon className="h-4 w-4 shrink-0 text-primary-600" aria-hidden />
                  Ask us to delete your account
                  <ArrowRight
                    className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100"
                    aria-hidden
                  />
                </Link>
              </li>
            </ul>
          </HeroAside>
        }
      />

      <ProseBand
        sections={page.sections}
        eyebrow="The policy, in plain terms"
        title="How your data is handled"
        bg="muted"
        source={sourceNote(page.source)}
        footer={
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-ink-4">
              Read these too
            </span>
            {[
              { href: "/terms", label: "Terms of service" },
              { href: "/cookies", label: "Cookies & storage" },
              { href: "/security", label: "Security" },
              { href: "/refund", label: "Refund policy" },
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
    </>
  );
}
