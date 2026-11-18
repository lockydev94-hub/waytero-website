import Image from "next/image";
import { CheckCircle2, Apple } from "lucide-react";
import { Container, Section } from "@/components/ui";
import { pick, type BandTone } from "@/types/cms";

interface AppDownloadSectionProps {
  variant: Record<string, unknown>;
  /** Homepage tone, decided by HomepageServer. Defaults to this band's
   *  own literal so every other page that uses it is unchanged. */
  bg?: BandTone;
  /** Settings → Footer → app store links, the same pair the footer uses
   *  (GET /public/homepage → footer.app_store_links). A badge only becomes
   *  a link once its URL is set; until then the store listing does not
   *  exist and the badge paints without navigating anywhere. */
  storeLinks?: { android?: string; ios?: string };
}

interface Benefit {
  icon?: string;
  label: string;
}

const DEFAULT_BENEFITS: Benefit[] = [
  { label: "Quick Booking" },
  { label: "Real-time Tracking" },
  { label: "Exclusive Offers" },
  { label: "Manage Bookings" },
];

/** The artwork the band ships with: two app screens on a phone pair. */
const PHONES = "/assets/homepage/07-app-promotion/waytero-odisha-travel-app-mockup-2.webp";
const QR = "/assets/homepage/07-app-promotion/waytero-app-qr.svg";

/** Google Play mark — four-colour triangle, drawn rather than bundled so the
 *  badge stays crisp at any size. */
function PlayMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <defs>
        <linearGradient id="play-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00D3FF" />
          <stop offset="100%" stopColor="#0080FF" />
        </linearGradient>
        <linearGradient id="play-b" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#FFCE00" />
          <stop offset="100%" stopColor="#FF8A00" />
        </linearGradient>
      </defs>
      <path d="M3.6 1.8 13.9 12 3.6 22.2a1.6 1.6 0 0 1-.6-1.3V3.1c0-.5.2-1 .6-1.3Z" fill="url(#play-a)" />
      <path d="m16.1 9.8 4.6 2.6c.9.5.9 1.7 0 2.2l-4.6 2.6L13.9 12l2.2-2.2Z" fill="#FF3A44" />
      <path d="M3.6 1.8c.4-.3 1-.4 1.5-.1l11 6.1-2.2 2.2L3.6 1.8Z" fill="#00E676" />
      <path d="M3.6 22.2 13.9 12l2.2 2.2-11 6.1c-.5.3-1.1.2-1.5-.1Z" fill="url(#play-b)" />
    </svg>
  );
}

function StoreBadge({
  href,
  sub,
  label,
  mark,
}: {
  href?: string;
  sub: string;
  label: string;
  mark: React.ReactNode;
}) {
  const body = (
    <>
      <span className="grid h-5 w-5 shrink-0 place-items-center">{mark}</span>
      <span className="flex flex-col text-left leading-none text-white">
        <span className="text-[7px] uppercase tracking-[0.08em] text-white/70">{sub}</span>
        <span className="mt-0.5 text-[12.5px] font-bold">{label}</span>
      </span>
    </>
  );
  const base =
    "inline-flex h-[38px] items-center gap-2 rounded-[9px] bg-[#101828] px-3 shadow-[0_4px_14px_-6px_rgba(16,24,40,0.5)]";

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={`${base} transition-transform hover:-translate-y-0.5`}>
        {body}
      </a>
    );
  }
  return <span className={base}>{body}</span>;
}

export default function AppDownloadSection({ variant, bg = "white", storeLinks }: AppDownloadSectionProps) {
  const eyebrow = pick<string>(variant, "variant_tag", "Get the WayTero App");
  const title = pick<string>(variant, "headline", "Book, Track & Travel on the Go");
  const subtitle = pick<string>(
    variant,
    "subheadline",
    "A smarter way to book cabs and tour packages anytime, anywhere.",
  );
  const items = pick<Benefit[]>(variant, "items", DEFAULT_BENEFITS);
  if (items.length === 0) return null;

  const play = storeLinks?.android?.trim() || "";
  const ios = storeLinks?.ios?.trim() || "";

  return (
    <Section bg={bg} id="app" pad="none" className="relative pt-7 pb-8 lg:pt-8 lg:pb-10">
      <Container size="wide">
        {/* One rounded panel, not a full-bleed band: the artwork bleeds off the
            panel's left and bottom edges, which only works inside a frame. */}
        <div className="relative overflow-hidden rounded-[26px] bg-[linear-gradient(100deg,#FFF8F4_0%,#FBF7FE_48%,#EDF4FE_100%)] ring-1 ring-black/[0.04]">
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-16 -left-12 h-44 w-64 rounded-full bg-[#F9D8C4]/60 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -top-20 right-8 h-44 w-44 rounded-full bg-[#DCE9FD]/60 blur-3xl"
          />

          <div className="relative flex flex-col gap-5 px-6 py-6 sm:px-8 lg:flex-row lg:items-stretch lg:gap-7 lg:py-0 lg:pr-8 lg:pl-0">
            {/* Phone pair — the design crops it at the panel's left/bottom edge. */}
            <div className="relative mx-auto h-[190px] w-[240px] shrink-0 overflow-hidden rounded-2xl lg:mx-0 lg:h-auto lg:w-[290px] lg:self-stretch lg:rounded-none">
              <Image
                src={PHONES}
                alt="WayTero app home screen and cab booking screen"
                fill
                sizes="(min-width: 1024px) 290px, 240px"
                className="object-cover object-[50%_32%]"
              />
            </div>

            <div className="min-w-0 flex-1 lg:self-center lg:py-7">
              {eyebrow && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FCE9DC] px-2.5 py-[5px] text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#D9531E]">
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent-500" />
                  {eyebrow}
                </span>
              )}
              <h2 className="mt-3 max-w-[312px] text-[22px] font-extrabold leading-[1.15] tracking-[-0.01em] text-primary-700 sm:text-[24px]">
                {title}
              </h2>
              {subtitle && (
                <p className="mt-2 max-w-[340px] text-[12.5px] leading-relaxed text-ink-4">{subtitle}</p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <StoreBadge
                  href={play || undefined}
                  sub="Get it on"
                  label="Google Play"
                  mark={<PlayMark className="h-[18px] w-[18px]" />}
                />
                <StoreBadge
                  href={ios || undefined}
                  sub="Download on the"
                  label="App Store"
                  mark={<Apple className="h-[18px] w-[18px] fill-white text-white" strokeWidth={1.5} />}
                />
              </div>
            </div>

            <div className="flex shrink-0 items-start justify-between gap-5 lg:self-center lg:py-7">
              <ul className="flex flex-col gap-3.5">
                {items.map((b, i) => (
                  <li
                    key={b.label || i}
                    className="flex items-center gap-2.5 text-[12.5px] font-semibold text-ink"
                  >
                    <CheckCircle2
                      className="h-4 w-4 shrink-0 fill-primary-600 text-white"
                      strokeWidth={2.5}
                      aria-hidden
                    />
                    {b.label}
                  </li>
                ))}
              </ul>

              {/* No QR on phones: you cannot scan the screen you are holding,
                  so the badges are the whole CTA there. */}
              <div className="hidden w-[104px] shrink-0 rounded-xl bg-white p-2 text-center shadow-[0_4px_14px_-8px_rgba(16,24,40,0.4)] ring-1 ring-black/[0.04] sm:block">
                <Image
                  src={QR}
                  alt="QR code to download the WayTero app"
                  width={80}
                  height={80}
                  unoptimized
                  className="mx-auto h-20 w-20"
                />
                <p className="mt-1 text-[9.5px] font-bold leading-tight text-ink">Scan to Download</p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
