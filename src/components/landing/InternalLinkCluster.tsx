import Link from "next/link";
import { ArrowUpRight, MapPin, Compass } from "lucide-react";
import { Container, Section, SectionHeader } from "@/components/ui";
import type { LandingLink } from "@/lib/landingIndex";

// ============================================================
// InternalLinkCluster — the web that keeps a visitor inside the
// platform: the other pages for this place (siblings) plus
// neighbouring cities (nearby). On phones "nearby" collapses into
// a <details> so the primary links stay above the fold.
// ============================================================

function LinkCard({ link, muted }: { link: LandingLink; muted?: boolean }) {
  return (
    <Link
      href={link.href}
      className={`group flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition-all hover:-translate-y-0.5 ${
        muted
          ? "border-ink-7 bg-white text-ink-3 hover:border-accent-200 hover:text-accent-600"
          : "border-primary-100 bg-primary-50/60 text-primary-700 hover:border-primary-300 hover:bg-primary-50"
      }`}
    >
      <span className="inline-flex items-center gap-2">
        {muted ? (
          <MapPin className="h-4 w-4 shrink-0 opacity-70" />
        ) : (
          <Compass className="h-4 w-4 shrink-0 opacity-70" />
        )}
        {link.label}
      </span>
      <ArrowUpRight className="h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}

export default function InternalLinkCluster({
  title,
  siblings,
  nearby,
}: {
  title?: string | null;
  siblings: LandingLink[];
  nearby: LandingLink[];
}) {
  if (!siblings.length && !nearby.length) return null;

  return (
    <Section bg="muted" pad="md">
      <Container size="xl">
        <SectionHeader
          eyebrow="Explore"
          title={title ?? "More to see and book"}
        />

        {siblings.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {siblings.map((s) => (
              <LinkCard key={s.slug} link={s} />
            ))}
          </div>
        )}

        {nearby.length > 0 && (
          <>
            {/* <640: nearby behind a disclosure */}
            <details className="mt-6 rounded-xl border border-ink-7 bg-white sm:hidden">
              <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-ink">
                Neighbouring cities
              </summary>
              <div className="grid grid-cols-1 gap-3 px-4 pb-4">
                {nearby.map((n) => (
                  <LinkCard key={n.slug} link={n} muted />
                ))}
              </div>
            </details>
            {/* sm+: always open */}
            <div className="mt-6 hidden grid-cols-2 gap-3 sm:grid lg:grid-cols-3 xl:grid-cols-4">
              {nearby.map((n) => (
                <LinkCard key={n.slug} link={n} muted />
              ))}
            </div>
          </>
        )}
      </Container>
    </Section>
  );
}
