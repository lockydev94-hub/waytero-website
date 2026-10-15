"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
import { Container, Section, SectionHeader, MotionFadeIn } from "@/components/ui";
import { pick } from "@/types/cms";

interface FaqSectionProps {
  variant: Record<string, unknown>;
}

interface Faq {
  question: string;
  answer: string;
}

export default function FaqSection({ variant }: FaqSectionProps) {
  const eyebrow = pick<string>(variant, "variant_tag", "Help centre");
  const title = pick<string>(variant, "headline", "Frequently Asked Questions");
  const subtitle = pick<string>(variant, "subheadline", "Everything you need to know before you book.");
  const ctaText = pick<string | null>(variant, "cta_text", null);
  const ctaLink = pick<string | null>(variant, "cta_link", null);
  // Admin-authored only — the site never shows invented FAQs (owner rule).
  const faqs = pick<Faq[]>(variant, "faqs", []);
  const [open, setOpen] = useState<number>(0);
  if (faqs.length === 0) return null;

  return (
    <Section bg="muted" pad="lg" id="faq" overlay="dots">
      <Container size="md">
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          accent="primary"
          underline
          animatedEyebrow
          actions={
            ctaText && ctaLink ? (
              <a href={ctaLink} className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                <HelpCircle className="h-4 w-4" /> {ctaText}
              </a>
            ) : undefined
          }
        />
        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <MotionFadeIn key={faq.question} delay={i * 0.05}>
                <div
                  className={`group rounded-2xl bg-white border overflow-hidden transition-all duration-300 ease-[var(--ease-wt)] ${
                    isOpen
                      ? "border-primary-300 shadow-wt ring-1 ring-primary-200/60"
                      : "border-ink-7 hover:border-primary-200 hover:shadow-wt hover:-translate-y-0.5 hover:bg-primary-50/20"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className={`font-semibold transition-colors ${isOpen ? "text-primary-700" : "text-ink group-hover:text-primary-700"}`}>{faq.question}</span>
                    <span
                      className={`h-7 w-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isOpen ? "bg-primary-600 text-white rotate-180" : "bg-ink-9 text-primary-500 group-hover:bg-primary-50"
                      }`}
                      aria-hidden
                    >
                      <ChevronDown className="h-4 w-4" />
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
                        <div className="px-5 pb-5 text-sm text-ink-3 leading-relaxed border-t border-ink-7 pt-4">{faq.answer}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </MotionFadeIn>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
