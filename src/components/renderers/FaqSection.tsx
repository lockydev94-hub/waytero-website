"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  HelpCircle,
  Car,
  Palmtree,
  CreditCard,
  CalendarCheck,
  ShieldCheck,
  BedDouble,
  type LucideIcon,
} from "lucide-react";
import { Container, Section } from "@/components/ui";
import { pick, type BandTone } from "@/types/cms";

interface FaqSectionProps {
  variant: Record<string, unknown>;
  /** Homepage tone, decided by HomepageServer. Defaults to this band's
   *  own literal so every other page that uses it is unchanged. */
  bg?: BandTone;
}

interface Faq {
  question: string;
  answer: string;
  /** Tab this question files under. Blank falls into "General". */
  category?: string;
}

/** Category → icon. Unknown names fall back to HelpCircle, so an admin can
 *  type a new tab without touching this file. */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  General: HelpCircle,
  "Cab Booking": Car,
  "Tour Packages": Palmtree,
  "Payments & Refunds": CreditCard,
  "Booking Management": CalendarCheck,
  "Safety & Support": ShieldCheck,
  "Hotels & Stays": BedDouble,
};

const ART = "/assets/homepage/09-faq/odisha-travel-adventure-in-3d.webp";

/**
 * FaqSection — "Frequently Asked Questions".
 *
 * A category rail on the left filters a single accordion on the right, with
 * the travel artwork closing the row. The rail is built from the questions'
 * own `category` values, so a band with uncategorised questions still works:
 * one group means no rail at all and the accordion simply takes the width.
 *
 * Questions and answers are admin-authored only — the site never shows
 * invented FAQs (owner rule).
 */
export default function FaqSection({ variant, bg = "muted" }: FaqSectionProps) {
  const title = pick<string>(variant, "headline", "Frequently Asked Questions");
  const subtitle = pick<string>(variant, "subheadline", "Everything you need to know before you book.");
  const ctaText = pick<string | null>(variant, "cta_text", null);
  const ctaLink = pick<string | null>(variant, "cta_link", null);
  const faqs = pick<Faq[]>(variant, "faqs", []);

  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [openQ, setOpenQ] = useState<string | null>(null);

  if (faqs.length === 0) return null;

  // Group in the order the categories first appear, so the rail follows the
  // admin's own sequence rather than an alphabetical one.
  const groups = new Map<string, Faq[]>();
  for (const f of faqs) {
    const cat = (f.category || "General").trim();
    const list = groups.get(cat);
    if (list) list.push(f);
    else groups.set(cat, [f]);
  }
  const categories = Array.from(groups.keys());
  const current = activeCat && groups.has(activeCat) ? activeCat : categories[0];
  const visible = groups.get(current) ?? [];
  const showRail = categories.length > 1;

  return (
    <Section bg={bg} pad="none" id="faq" className="relative overflow-hidden pt-7 pb-9 lg:pt-8 lg:pb-11">
      {/* The band's own wash — the white rows need a tint behind them to read
          as cards, and it is what the artwork's white background blends into. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#FFFFFF_0%,#F4F8FE_52%,#E9F1FC_100%)]"
      />

      <Container size="wide" className="relative">
        <div className="text-center">
          <h2 className="flex items-center justify-center gap-2.5 text-[21px] font-extrabold tracking-[-0.01em] text-primary-700 sm:text-[23px] lg:text-[26px]">
            <span aria-hidden className="h-[3px] w-4 shrink-0 rounded-full bg-accent-500" />
            <span>{title}</span>
            <span aria-hidden className="h-[3px] w-4 shrink-0 rounded-full bg-accent-500" />
          </h2>
          {subtitle && <p className="mt-1.5 text-[13px] leading-relaxed text-ink-4">{subtitle}</p>}
          {ctaText && ctaLink && (
            <a
              href={ctaLink}
              className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-semibold text-primary-600 transition-colors hover:text-primary-700"
            >
              <HelpCircle className="h-3.5 w-3.5" aria-hidden /> {ctaText}
            </a>
          )}
        </div>

        <div
          className={`mt-5 grid gap-4 lg:mt-6 lg:gap-6 ${
            showRail ? "lg:grid-cols-[180px_minmax(0,1fr)]" : "lg:grid-cols-1"
          } ${showRail ? "xl:grid-cols-[184px_minmax(0,1fr)_188px]" : "xl:grid-cols-[minmax(0,1fr)_188px]"}`}
        >
          {showRail && (
            <nav aria-label="Question categories" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
              <ul className="flex gap-1.5 lg:flex-col">
                {categories.map((cat) => {
                  const Icon = CATEGORY_ICONS[cat] ?? HelpCircle;
                  const active = cat === current;
                  return (
                    <li key={cat} className="shrink-0 lg:shrink">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveCat(cat);
                          setOpenQ(null);
                        }}
                        aria-pressed={active}
                        className={`flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-left text-[12px] font-semibold transition-colors ${
                          active
                            ? "bg-accent-500 text-white shadow-[0_8px_18px_-10px_rgba(240,90,34,0.9)]"
                            : "bg-[#EDF3FC] text-ink hover:bg-[#E2EBF9]"
                        }`}
                      >
                        <Icon
                          className={`h-3.5 w-3.5 shrink-0 ${active ? "text-white" : "text-primary-600"}`}
                          aria-hidden
                        />
                        {cat}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          )}

          <div className="space-y-2">
            {visible.map((faq) => {
              const isOpen = openQ === faq.question;
              return (
                <div
                  key={faq.question}
                  className={`overflow-hidden rounded-[10px] bg-white transition-shadow duration-300 ${
                    isOpen
                      ? "shadow-[0_10px_26px_-16px_rgba(16,24,40,0.4)] ring-1 ring-primary-200"
                      : "ring-1 ring-black/[0.05] hover:ring-primary-200/70"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenQ(isOpen ? null : faq.question)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left"
                  >
                    <span className={`text-[12.5px] font-semibold leading-snug ${isOpen ? "text-primary-700" : "text-ink"}`}>
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 shrink-0 text-primary-500 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                      aria-hidden
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="answer"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-ink-7/70 px-3.5 pb-3 pt-2 text-[12.5px] leading-relaxed text-ink-3">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Artwork closes the row on wide screens; multiply drops its white
              background into the band wash instead of pasting a white box. */}
          <div aria-hidden className="relative hidden h-[232px] w-[196px] self-center xl:block">
            <Image
              src={ART}
              alt=""
              fill
              sizes="196px"
              className="object-cover object-[84%_30%] mix-blend-multiply"
            />
          </div>
        </div>
      </Container>
    </Section>
  );
}
