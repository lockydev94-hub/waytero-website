/**
 * LegalSection — shared building blocks for the legal/prose pages
 * (cookies, security, and future policies). Each page composes these into
 * its route file so every policy page shares the same shell.
 */

import { ReactNode } from "react";
import { Container, Section, PageHeader, Card, MotionFadeIn } from "@/components/ui";

export interface LegalPageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  meta?: string;
}

export function LegalPageHeader({
  eyebrow = "Legal",
  title,
  subtitle,
  meta,
}: LegalPageHeaderProps) {
  return (
    <Section
      bg="grid"
      pad="lg"
      className="bg-gradient-to-br from-primary-50/40 via-white to-white relative overflow-hidden"
    >
      {/* Subtle background blobs */}
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-primary-100/40 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-accent-100/30 blur-3xl" />
      <Container size="md" className="relative">
        <PageHeader eyebrow={eyebrow} title={title} subtitle={subtitle ?? meta} />
      </Container>
    </Section>
  );
}

export interface PolicySectionProps {
  heading: string;
  children: ReactNode;
}

/** A numbered/headed block of policy text. */
export function PolicySection({ heading, children }: PolicySectionProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-ink relative inline-block">
        {heading}
        <span aria-hidden className="absolute -bottom-1 left-0 h-0.5 w-12 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full" />
      </h2>
      {children}
    </div>
  );
}

export interface PolicyListProps {
  heading?: string;
  items: string[];
}

/** Bulleted policy list — optionally under a PolicySection heading. */
export function PolicyList({ heading, items }: PolicyListProps) {
  return (
    <div className="space-y-3">
      {heading && <h2 className="text-xl font-bold text-ink">{heading}</h2>}
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={item} className="flex items-start gap-2.5">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex-shrink-0" aria-hidden />
            <span className="text-ink-2">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface LegalBodyProps {
  children: ReactNode;
}

/** The prose container every policy page renders its content inside. */
export function LegalBody({ children }: LegalBodyProps) {
  return (
    <Section bg="grid" pad="md">
      <Container size="md">
        <MotionFadeIn>
          <Card variant="premium" hover={false} className="prose prose-slate max-w-none border-gradient-primary">
            <div className="space-y-6 text-ink-2 leading-relaxed">{children}</div>
          </Card>
        </MotionFadeIn>
      </Container>
    </Section>
  );
}
