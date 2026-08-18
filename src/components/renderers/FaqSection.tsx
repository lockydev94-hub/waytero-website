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

const PLACEHOLDER: Faq[] = [
  { question: "How do I book a cab with WayTero?", answer: "Choose your trip type, enter pickup and drop locations and a date-time, review the fare breakdown and confirm. You can pay online or use wallet balance." },
  { question: "Can I get a refund if I cancel my booking?", answer: "Yes — cancellations follow the policy shown at checkout. Refunds are processed back to your source or wallet within 3-5 business days." },
  { question: "Are the hotels verified?", answer: "Every partner hotel goes through document verification, live audits and guest-rating reviews before it is listed on WayTero." },
  { question: "How do I track my cab in real time?", answer: "Once your driver is assigned, open the Track page and enter your booking number + mobile to follow the live route and driver location." },
  { question: "What payment methods are accepted?", answer: "UPI, debit/credit cards, net-banking and WayTero Wallet. Wallet recharges can be used for instant checkouts with wallet rewards." },
  { question: "Is my data safe with WayTero?", answer: "Yes. All payments are processed over encrypted channels and we follow strict data-security practices. See our Privacy & Security pages for details." },
];

export default function FaqSection({ variant }: FaqSectionProps) {
  const eyebrow = pick<string>(variant, "variant_tag", "Help centre");
  const title = pick<string>(variant, "headline", "Frequently Asked Questions");
  const subtitle = pick<string>(variant, "subheadline", "Everything you need to know before you book.");
  const ctaText = pick<string | null>(variant, "cta_text", null);
  const ctaLink = pick<string | null>(variant, "cta_link", null);
  const faqs = pick<Faq[]>(variant, "faqs", PLACEHOLDER);
  const [open, setOpen] = useState<number>(0);

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
