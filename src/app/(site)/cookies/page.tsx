import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PageHero, { HeroAside } from "@/components/sections/PageHero";
import ProseBand from "@/components/sections/ProseBand";
import { getPageBody, resolvePage, sourceNote } from "@/lib/pageBody";
import { PAGE_BODIES } from "@/content/pageBodies";
import { pageMetadata, type SeoContent } from "@/services/seoService";
import StaticPageSeo from "@/components/sections/StaticPageSeo";

const META_FALLBACK: SeoContent = {
  title: "Cookies & Browser Storage — WayTero",
  description:
    "WayTero sets no advertising or tracking cookies. Here is exactly what the site keeps in your browser, and what each entry is for.",
  keywords: ["WayTero cookies", "browser storage", "cookie policy India"],
};

export async function generateMetadata(): Promise<import("next").Metadata> {
  return pageMetadata("cookies", "/cookies", META_FALLBACK);
}

// The keys the site actually writes, read from the code that writes them:
// src/hooks/useAuth.ts, src/lib/api.ts, src/lib/placeIntent.ts and
// src/components/chat/ChatWidget.tsx. This list is a summary of the policy
// below, so it is kept here rather than in the database — a key that no longer
// exists in the code would be a claim this page could not support.
const STORED = [
  {
    group: "Sign-in",
    keys: ["wt_customer_access", "wt_customer_refresh"],
    note: "Your access and refresh tokens. Clearing them signs you out.",
  },
  {
    group: "Visit choices",
    keys: ["wt_intent_place", "wt_intent_dismissed", "wt_geo_asked"],
    note: "The place you last searched, and whether you already closed a prompt.",
  },
  {
    group: "Support chat",
    keys: ["wt_chat_guest_key", "wt_chat_guest_name", "wt_chat_conversation"],
    note: "Only if you open the chat — so the conversation is still there when you return.",
  },
];

export default async function CookiesPage() {
  const page = resolvePage(await getPageBody("cookies"), PAGE_BODIES.cookies);

  return (
    <>
      <StaticPageSeo pageKey="cookies" path="/cookies" name="Cookie Policy" crumb="Cookies" />
      <PageHero
        eyebrow={page.eyebrow ?? "Legal"}
        title={page.title}
        accent="Browser Storage"
        description={page.description}
        meta={page.meta}
        side={
          <HeroAside title="What this site keeps in your browser">
            <ul className="space-y-4 text-sm">
              {STORED.map((row) => (
                <li key={row.group}>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-primary-600">
                    {row.group}
                  </p>
                  <p className="mt-1 font-mono text-[11px] leading-relaxed text-ink-3">
                    {row.keys.join(" · ")}
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{row.note}</p>
                </li>
              ))}
            </ul>
          </HeroAside>
        }
      />

      <ProseBand
        sections={page.sections}
        eyebrow="No tracking, no consent banner"
        title="What is stored, and why"
        bg="muted"
        source={sourceNote(page.source)}
        footer={
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-ink-4">
              Related
            </span>
            {[
              { href: "/privacy", label: "Privacy policy" },
              { href: "/security", label: "How the account is protected" },
              { href: "/account-deletion", label: "Delete your account" },
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
