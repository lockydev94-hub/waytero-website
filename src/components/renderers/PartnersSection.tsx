import { ArrowRight } from "lucide-react";
import { Container, Section } from "@/components/ui";
import { pick, type BandTone } from "@/types/cms";

interface PartnersSectionProps {
  variant: Record<string, unknown>;
  /** Homepage tone, decided by HomepageServer. Defaults to this band's
   *  own literal so every other page that uses it is unchanged. */
  bg?: BandTone;
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/**
 * PartnersSection — "Backed by India's Best".
 *
 * A row of partner chips rather than a logo marquee: the CMS holds names, not
 * logos, and the old marquee duplicated whatever it was given, so a single
 * partner scrolled past as one lonely card in a wide empty band. Chips centre
 * themselves whether there is one partner or ten.
 *
 * Only brands the admin configured are shown — the old hardcoded wall
 * (OYO/Taj/Marriott…) implied partnerships that don't exist, so an empty list
 * still hides the band entirely.
 */
export default function PartnersSection({ variant, bg = "muted" }: PartnersSectionProps) {
  const title = pick<string>(variant, "headline", pick<string>(variant, "title", "Backed by India's Best"));
  const subtitle = pick<string>(
    variant,
    "subheadline",
    pick<string>(variant, "subtitle", "We work with the brands you trust — hotels, banks, and payment partners."),
  );
  const partners = pick<string[]>(variant, "partners", []);
  if (partners.length === 0) return null;
  const cta = pick<{ label: string; href: string }>(variant, "cta", {
    label: "Become a Partner",
    href: "/partner",
  });

  return (
    <Section bg={bg} pad="none" id="partners" className="relative overflow-hidden pt-7 pb-8 lg:pt-8 lg:pb-10">
      <Container size="wide">
        <div className="text-center">
          <h2 className="flex items-center justify-center gap-2.5 text-[21px] font-extrabold tracking-[-0.01em] text-ink sm:text-[23px] lg:text-[25px]">
            <span aria-hidden className="h-[3px] w-4 shrink-0 rounded-full bg-accent-500" />
            <span>{title}</span>
            <span aria-hidden className="h-[3px] w-4 shrink-0 rounded-full bg-accent-500" />
          </h2>
          {subtitle && (
            <p className="mx-auto mt-1.5 max-w-[520px] text-[13px] leading-relaxed text-ink-4">{subtitle}</p>
          )}
        </div>

        <ul className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {partners.map((name) => (
            <li
              key={name}
              className="flex items-center gap-3 rounded-xl bg-white py-3 pl-3 pr-5 shadow-[0_8px_24px_-20px_rgba(16,24,40,0.5)] ring-1 ring-black/[0.05]"
            >
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-50 text-[12px] font-extrabold text-primary-700">
                {initials(name)}
              </span>
              <span className="text-[13.5px] font-bold text-ink">{name}</span>
            </li>
          ))}
        </ul>

        {cta.label && cta.href && (
          <div className="mt-5 text-center">
            <a
              href={cta.href}
              className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-primary-600 transition-colors hover:text-primary-700"
            >
              {cta.label}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </a>
          </div>
        )}
      </Container>
    </Section>
  );
}
