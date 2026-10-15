import PageFaq, { type FaqItem } from "@/components/sections/PageFaq";
import type { LandingFaq as LandingFaqType } from "@/lib/landingIndex";

// ============================================================
// LandingFaq — thin bridge from the payload's {question,answer}[]
// to the shared accordion. The page component owns the FAQPage
// JSON-LD so the markup and this visible list come from ONE array
// (Google requires the structured data to match what's shown).
// ============================================================

export default function LandingFaq({ faqs }: { faqs: LandingFaqType[] }) {
  const items: FaqItem[] = faqs
    .filter((f) => f.question?.trim() && f.answer?.trim())
    .map((f) => ({ question: f.question.trim(), answer: f.answer.trim() }));
  if (!items.length) return null;
  return <PageFaq faqs={items} />;
}
