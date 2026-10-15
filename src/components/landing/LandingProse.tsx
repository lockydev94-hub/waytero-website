import { Container, Section, MotionFadeIn } from "@/components/ui";

// ============================================================
// LandingProse — admin-authored body copy for a block. Renders
// paragraphs split on blank lines. No raw HTML (XSS surface).
// ============================================================

export default function LandingProse({
  title,
  body,
}: {
  title?: string | null;
  body?: string | null;
}) {
  if (!body || !body.trim()) return null;
  const paras = body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return (
    <Section bg="white" pad="md">
      <Container size="md">
        {title && (
          <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            {title}
          </h2>
        )}
        <MotionFadeIn className={title ? "mt-4 space-y-4" : "space-y-4"}>
          {paras.map((p, i) => (
            <p key={i} className="text-[15px] leading-relaxed text-ink-3 sm:text-base">
              {p}
            </p>
          ))}
        </MotionFadeIn>
      </Container>
    </Section>
  );
}
