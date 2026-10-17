import type { ReactNode } from "react";
import { Container, Section, MotionFadeIn } from "@/components/ui";
import type { BandTone } from "@/types/cms";

/* ============================================================
   PageHero — the band that opens a rebuilt marketing page.

   It replaces `PageHeader` on these routes for two reasons: PageHeader
   carries its own vertical padding, so a page that put it inside a
   `pad="lg"` section paid the gap twice and read as three screens tall;
   and it could not hold the side card these pages need (how to cancel,
   what to have ready before you call).

   Same rhythm as every other band: `pad="tight"`, white, and the tone
   alternation below it is the page's job.
   ============================================================ */

/** Highlights `accent` inside `title`. When an admin rewords the title in
 *  Website → Pages and the phrase no longer appears, nothing is highlighted
 *  — a plain headline is a better failure than mangling the sentence. */
function Title({ title, accent }: { title: string; accent?: string }) {
  const at = accent ? title.indexOf(accent) : -1;
  if (at < 0) return <>{title}</>;
  return (
    <>
      {title.slice(0, at)}
      <span className="text-gradient-primary">{accent}</span>
      {title.slice(at + (accent as string).length)}
    </>
  );
}

export default function PageHero({
  eyebrow,
  title,
  accent,
  description,
  meta,
  side,
  actions,
  bg = "white",
  overlay = "none",
  id = "top",
}: {
  eyebrow?: string;
  title: string;
  accent?: string;
  description?: string;
  /** "Effective … · Last updated …" — only a database body carries dates,
   *  so the built-in fallback passes nothing and prints none. */
  meta?: string;
  /** Card opposite the headline. Its presence is what widens the container
   *  and switches the band to two columns. */
  side?: ReactNode;
  actions?: ReactNode;
  bg?: BandTone;
  overlay?: "none" | "dots-faint" | "grid-faint";
  id?: string;
}) {
  return (
    <Section bg={bg} pad="tight" id={id} overlay={overlay}>
      <Container size={side ? "xl" : "lg"}>
        <MotionFadeIn>
          <div
            className={
              side
                ? "grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-center"
                : "max-w-3xl"
            }
          >
            <div>
              {eyebrow && (
                <p className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-500" aria-hidden />
                  {eyebrow}
                </p>
              )}
              <h1 className="text-3xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-4xl lg:text-[2.75rem]">
                <Title title={title} accent={accent} />
              </h1>
              {description && (
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-3 sm:text-lg">
                  {description}
                </p>
              )}
              {meta && (
                <p className="mt-3 text-xs font-bold uppercase tracking-wide text-ink-4">{meta}</p>
              )}
              {actions && <div className="mt-5 flex flex-wrap items-center gap-3">{actions}</div>}
            </div>
            {side}
          </div>
        </MotionFadeIn>
      </Container>
    </Section>
  );
}

/** The hero's side card, pre-skinned so every page dresses it the same way. */
export function HeroAside({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-ink-7 bg-ink-9/60 p-6">
      <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}
