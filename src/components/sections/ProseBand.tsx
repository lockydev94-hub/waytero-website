import type { ReactNode } from "react";
import { Container, Section, SectionHeader } from "@/components/ui";
import type { BandTone } from "@/types/cms";
import type { LegalSection } from "@/services/publicCms";

/* ============================================================
   ProseBand — a run of heading + paragraph rows, exactly as authored in
   Website → Pages.

   Long-form text is the one place this site does not use a card: on a white
   band the "opposite light step" would be a navy panel, and a navy panel of
   policy text nobody can read is not a design, it is a bug. So the surface
   stays light on light and takes a 5% ink wash instead, and reverses to
   white on the off-white band.

   Every body renders `whitespace-pre-line`: an admin pressing Enter in the
   editor means a line break, and three of the existing pages swallowed them.
   ============================================================ */

export default function ProseBand({
  sections,
  eyebrow,
  title,
  subtitle,
  bg = "muted",
  pad = "tight",
  overlay = "none",
  id = "policy",
  source,
  footer,
}: {
  sections: LegalSection[];
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  bg?: BandTone;
  pad?: "tight" | "sm" | "md" | "lg";
  overlay?: "none" | "dots-faint" | "grid-faint";
  id?: string;
  /** One line under the text: which copy the reader is looking at. */
  source?: string;
  /** Cross-links, e.g. "Want to delete your account? Request deletion". */
  footer?: ReactNode;
}) {
  if (!sections.length) return null;

  const panel =
    bg === "white"
      ? "border-ink-7 bg-ink-9/5"
      : "border-ink-7 bg-white shadow-wt-sm";

  return (
    <Section bg={bg} pad={pad} id={id} overlay={overlay}>
      <Container size="sm">
        {(eyebrow || title) && (
          <SectionHeader
            eyebrow={eyebrow}
            title={title}
            subtitle={subtitle}
            accent="primary"
            underline
            animatedEyebrow
            scale="home"
          />
        )}

        <div className={`rounded-3xl border p-6 sm:p-8 ${panel}`}>
          <div className="space-y-7">
            {sections.map((s) => (
              <div key={s.heading}>
                <h2 className="text-base font-extrabold text-ink sm:text-lg">{s.heading}</h2>
                <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-ink-2">
                  {s.body}
                </p>
              </div>
            ))}
          </div>

          {(source || footer) && (
            <div className="mt-7 space-y-3 border-t border-ink-7 pt-4">
              {footer}
              {source && (
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-4">
                  {source}
                </p>
              )}
            </div>
          )}
        </div>
      </Container>
    </Section>
  );
}
