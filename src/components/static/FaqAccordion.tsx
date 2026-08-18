"use client";

/**
 * FaqAccordion — accessible accordion used across the static pages
 * (support, careers, press). Composed into the page with Section/Container
 * by the caller.
 */

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Container, Section, SectionHeader, MotionFadeIn } from "@/components/ui";
import { MotionStagger, MotionStaggerItem } from "@/components/ui";

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqAccordionProps {
  items: FaqItem[];
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  id?: string;
}

export default function FaqAccordion({
  items,
  eyebrow = "FAQ",
  title = "Frequently asked questions",
  subtitle,
  id,
}: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <Section bg="white" pad="lg" id={id} overlay="dots">
      <Container size="md">
        <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} accent="primary" underline animatedEyebrow />
        <MotionStagger className="mt-10 space-y-3">
          {items.map((item, i) => {
            const open = openIndex === i;
            return (
              <MotionStaggerItem key={item.question}>
                <div
                  className={`group rounded-2xl border bg-white overflow-hidden transition-all duration-300 ease-[var(--ease-wt)] ${
                    open
                      ? "border-primary-300 shadow-wt ring-1 ring-primary-200/60"
                      : "border-ink-7 hover:border-primary-200 hover:shadow-wt hover:-translate-y-0.5"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(open ? null : i)}
                    aria-expanded={open}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className={`font-bold text-sm sm:text-base transition-colors ${open ? "text-primary-700" : "text-ink group-hover:text-primary-700"}`}>{item.question}</span>
                    <span
                      className={`h-7 w-7 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                        open ? "bg-primary-600 text-white rotate-180" : "bg-ink-9 text-primary-500 group-hover:bg-primary-50"
                      }`}
                      aria-hidden
                    >
                      <ChevronDown className="h-4 w-4" />
                    </span>
                  </button>
                  {open && (
                    <div className="px-5 pb-5 -mt-1 border-t border-ink-7 pt-4">
                      <p className="text-sm text-ink-3 leading-relaxed">{item.answer}</p>
                    </div>
                  )}
                </div>
              </MotionStaggerItem>
            );
          })}
        </MotionStagger>
      </Container>
    </Section>
  );
}
