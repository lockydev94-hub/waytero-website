"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
import { Container, Section, SectionHeader, MotionFadeIn } from "@/components/ui";
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
}

export default function FaqSection({ variant, bg = "muted" }: FaqSectionProps) {
  const eyebrow = pick<string>(variant, "variant_tag", "Help centre");
  const title = pick<string>(variant, "headline", "Frequently Asked Questions");
  const subtitle = pick<string>(variant, "subheadline", "Everything you need to know before you book.");
  const ctaText = pick<string | null>(variant, "cta_text", null);
  const ctaLink = pick<string | null>(variant, "cta_link", null);
  // Admin-authored only — the site never shows invented FAQs (owner rule).
  const faqs = pick<Faq[]>(variant, "faqs", []);
  const [open, setOpen] = useState<number>(0);
  if (faqs.length === 0) return null;

  // Two balanced columns from `lg` up. Two CSS columns would stretch a shared
  // row when one answer opens, and one full-width column is what made this
  // band taller than the rest of the homepage, so the list is split in half
  // and each half keeps its own flow.
  const half = Math.ceil(faqs.length / 2);
  const columns: Array<Array<{ faq: Faq; index: number }>> =
    faqs.length > 1
      ? [faqs.slice(0, half).map((faq, index) => ({ faq, index })),
         faqs.slice(half).map((faq, index) => ({ faq, index: index + half }))]
      : [faqs.map((faq, index) => ({ faq, index }))];

  return (
    <Section bg={bg} pad="home" id="faq" overlay="dots-faint">
      <Container size="md">
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          accent="primary"
          underline
          animatedEyebrow
          scale="home"
          actions={
            ctaText && ctaLink ? (
              <a href={ctaLink} className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                <HelpCircle className="h-4 w-4" /> {ctaText}
              </a>
            ) : undefined
          }
        />
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-4">
          {columns.map((column, columnIndex) => (
            <div key={columnIndex} className="space-y-2">
              {column.map(({ faq, index }) => {
                const isOpen = open === index;
                return (
                  <MotionFadeIn key={faq.question} delay={Math.min(index, 4) * 0.04}>
                    <div
                      className={`group rounded-xl bg-white border overflow-hidden transition-all duration-300 ease-[var(--ease-wt)] ${
                        isOpen
                          ? "border-primary-300 shadow-wt ring-1 ring-primary-200/60"
                          : "border-ink-7 hover:border-primary-200 hover:bg-primary-50/20"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setOpen(isOpen ? -1 : index)}
                        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left"
                        aria-expanded={isOpen}
                      >
                        <span className={`text-sm font-semibold leading-snug transition-colors ${isOpen ? "text-primary-700" : "text-ink group-hover:text-primary-700"}`}>{faq.question}</span>
                        <span
                          className={`h-6 w-6 shrink-0 rounded-full flex items-center justify-center transition-all duration-300 ${
                            isOpen ? "bg-primary-600 text-white rotate-180" : "bg-ink-9 text-primary-500 group-hover:bg-primary-50"
                          }`}
                          aria-hidden
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </span>
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            key="answer"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-3.5 pt-2.5 text-[13px] text-ink-3 leading-relaxed border-t border-ink-7">{faq.answer}</div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </MotionFadeIn>
                );
              })}
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
