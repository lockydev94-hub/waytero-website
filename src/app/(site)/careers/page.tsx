import { CtaSection } from "@/components/renderers";
import FaqAccordion, { type FaqItem } from "@/components/static/FaqAccordion";
import {
  CareersHero,
  CultureGrid,
  OpenPositions,
  PerksBand,
} from "@/components/static/CareersSection";

export const metadata = {
  title: "Careers — WayTero",
  description: "Join WayTero — India's travel operating system. Open roles in engineering, design, growth, and support across Bhubaneswar, Bengaluru, and remote.",
};

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Where are your offices?",
    answer: "Our engineering hub is in Bhubaneswar, with a Bengaluru office for design and growth. Most roles are remote-friendly within India.",
  },
  {
    question: "Do you hire freshers?",
    answer: "Yes — we have a small but growing campus-hiring pipeline and pair every new engineer with a senior mentor for the first 90 days.",
  },
  {
    question: "What is the interview process like?",
    answer: "A 30-minute intro call, a take-home task or live problem-solving session, and one round with the team you'd join. We usually close within 10 days.",
  },
];

export default function CareersPage() {
  return (
    <>
      <CareersHero />
      <CultureGrid />
      <OpenPositions />
      <PerksBand />
      <FaqAccordion
        items={FAQ_ITEMS}
        eyebrow="Recruiting"
        title="Application questions"
      />
      <CtaSection
        variant={{
          title: "Don't see your role?",
          subtitle: "We're always hiring exceptional people — email your resume to careers@waytero.com.",
          cta_text: "Email us",
          cta_link: "mailto:careers@waytero.com",
        }}
      />
    </>
  );
}
