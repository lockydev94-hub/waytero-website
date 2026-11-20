import Image from "next/image";
import { Car, Hotel, Map, MapPin, ArrowRight, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Car,
  Hotel,
  Map,
  MapPin,
};

interface ServiceItem {
  icon?: string | LucideIcon;
  title: string;
  desc?: string;
  link?: string;
  tone?: "primary" | "accent" | "success" | "info";
  /** Optional per-card overrides. Absent, the design's own copy for that
   *  vertical is used (see DESIGN below). */
  badge?: string;
  headline?: string;
  cta_text?: string;
  image?: string;
}
import { Container, Section, MotionStagger, MotionStaggerItem } from "@/components/ui";
import { pick, type BandTone } from "@/types/cms";
import { isHiddenHref, type ServiceKey } from "@/lib/availability";

interface ServicesSectionProps {
  variant: Record<string, unknown>;
  /** Homepage tone, decided by HomepageServer. Defaults to this band's
   *  own literal so every other page that uses it is unchanged. */
  bg?: BandTone;
  /** Verticals hidden site-wide — cards linking into them are removed. */
  hidden?: ServiceKey[];
}

const DEFAULT: ServiceItem[] = [
  { title: "Cab Booking", desc: "Local, airport, one-way, outstation and round-trip cabs at best prices.", link: "/cabs", tone: "primary" },
  { title: "Hotel Booking", desc: "Handpicked hotels & homestays with transparent pricing.", link: "/hotels", tone: "accent" },
  { title: "Tour Packages", desc: "Discover India with curated tours, scenic trips and complete travel experiences.", link: "/tours", tone: "success" },
  { title: "Booking Tracking", desc: "Follow any booking by number — status, driver and vehicle once assigned.", link: "/track", tone: "info" },
];

/**
 * The design's own copy, per destination vertical. A CMS item only has to
 * supply `title` + `desc` + `link`; everything else about the card (badge
 * label, headline, button label, artwork) comes from here, so an admin who
 * rewrites the description does not silently lose the layout.
 *
 * `badge`/`headline`/`cta_text`/`image` on an item override these.
 */
const DESIGN: Record<
  string,
  { badge: string; headline: string; cta: string; image?: string }
> = {
  "/cabs": {
    badge: "Cab Booking",
    headline: "Ride Anywhere, Anytime",
    cta: "Book a Cab",
    image: "/assets/homepage/02-services/coastal-drive-at-golden-sunrise.webp",
  },
  "/tours": {
    badge: "Tour Packages",
    headline: "Discover India with Curated Tours",
    cta: "Explore Packages",
    image: "/assets/homepage/02-services/sunlit-temple-coast-tour-packages.webp",
  },
};

/**
 * Two palettes, mirroring the shared design: the cab card is warm cream,
 * everything else is cool blue. `tone: "primary"` picks warm.
 *
 * `wash` is the veil painted over the photo — opaque enough on the copy side
 * to hold 13.5px text, clear by the far edge so the artwork stays a photo and
 * not a tinted panel. It runs left→right on desktop and top→bottom on phones,
 * where the card is too narrow for a text column and a photo side by side.
 */
const PALETTE = {
  warm: {
    badge: "bg-white/85 text-accent-700 ring-accent-200",
    base: "bg-[#FDF0E1]",
    wash: "bg-[linear-gradient(180deg,#FFF4E9_0%,#FCE9D6_50%,rgba(252,233,214,0.74)_64%,rgba(252,233,214,0)_92%)] md:bg-[linear-gradient(90deg,#FFF4E9_0%,#FCE9D6_38%,rgba(252,233,214,0.8)_58%,rgba(252,233,214,0)_86%)]",
  },
  cool: {
    badge: "bg-white/85 text-primary-700 ring-primary-200",
    base: "bg-[#E4F0FE]",
    wash: "bg-[linear-gradient(180deg,#F1F8FF_0%,#E1EFFE_50%,rgba(225,239,254,0.74)_64%,rgba(225,239,254,0)_92%)] md:bg-[linear-gradient(90deg,#F1F8FF_0%,#E1EFFE_38%,rgba(225,239,254,0.8)_58%,rgba(225,239,254,0)_86%)]",
  },
} as const;

/** CMS rows are often saved with the singular service URL (`/cab`, `/hotel`,
 *  `/tour`); middleware redirects those, so treat them as the canonical
 *  page here too — otherwise the card falls out of DESIGN and renders as a
 *  bare panel with no artwork, badge or headline. */
const SERVICE_ALIASES: Record<string, string> = {
  "/cab": "/cabs",
  "/hotel": "/hotels",
  "/tour": "/tours",
};

function linkKey(link?: string) {
  if (!link) return "";
  const path = link.split("?")[0].replace(/\/+$/, "") || "/";
  return SERVICE_ALIASES[path] ?? path;
}

/**
 * ServicesSection — the "what we offer" band: two full-bleed photo cards.
 *
 * The shared design is a single row of image cards with no section heading —
 * the photo is the card, and the badge / headline / copy / button sit on a
 * soft wash over its left side. The headline is carried by each card, so the
 * CMS's band-level eyebrow / title / subtitle are deliberately not rendered
 * here (they are still editable and still used by other renderers).
 */
export default function ServicesSection({ variant, bg = "muted", hidden = [] }: ServicesSectionProps) {
  // The band has no visible heading any more — the cards carry the copy —
  // but the document still needs one above the card headings.
  const title = pick<string>(variant, "headline", pick<string>(variant, "title", "Everything for Your Journey"));
  const items = pick<ServiceItem[]>(variant, "items", DEFAULT).filter(
    (s) => !isHiddenHref(s.link, hidden),
  );
  if (items.length === 0) return null;

  return (
    <Section bg={bg} pad="none" id="services" className="py-5 lg:py-6">
      <Container size="wide">
        <h2 className="sr-only">{title}</h2>
        <MotionStagger className="grid gap-4 sm:gap-5 md:grid-cols-2">
          {items.map((s) => {
            const Icon = typeof s.icon === "string" ? (ICONS[s.icon] ?? Car) : s.icon || Car;
            const key = linkKey(s.link);
            const design = DESIGN[key];
            // No tone saved by the admin: keep the design's own colour for
            // that vertical rather than defaulting every card to warm.
            const tone = (["primary", "accent", "success", "info"] as const).includes(s.tone as never)
              ? (s.tone as never)
              : key === "/tours"
                ? "success"
                : key === "/hotels"
                  ? "accent"
                  : "primary";
            const pal = tone === "primary" ? PALETTE.warm : PALETTE.cool;

            const badge = s.badge?.trim() || design?.badge || s.title;
            const headline = s.headline?.trim() || design?.headline || s.title;
            const desc = s.desc?.trim() || "";
            const cta = s.cta_text?.trim() || design?.cta || "Explore";
            const image = s.image?.trim() || design?.image;

            return (
              <MotionStaggerItem key={`${s.title}-${key}`} className="h-full">
                <a
                  href={s.link}
                  className={`group relative flex h-full min-h-[340px] flex-col overflow-hidden rounded-[18px] shadow-[0_2px_12px_rgba(11,27,59,0.06)] transition-all duration-300 ease-[var(--ease-wt)] hover:-translate-y-1 hover:shadow-wt-lg md:min-h-[268px] ${pal.base}`}
                >
                  {image && (
                    <Image
                      src={image}
                      alt=""
                      fill
                      sizes="(max-width: 767px) 100vw, 45vw"
                      className="object-cover object-[68%_center]"
                    />
                  )}

                  {/* Veil that lets the copy sit on the photo. */}
                  <div aria-hidden className={`absolute inset-0 ${pal.wash}`} />

                  <div className="relative z-10 flex flex-1 flex-col p-6 sm:p-7 md:max-w-[60%]">
                    <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-semibold leading-none ring-1 ${pal.badge}`}>
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                      {badge}
                    </span>

                    <h3 className="mt-3.5 text-[23px] font-extrabold leading-[1.15] tracking-[-0.015em] text-ink md:text-[24px] xl:text-[25px]">
                      {headline}
                    </h3>

                    {desc && (
                      <p className="mt-2.5 max-w-[34ch] text-[13.5px] leading-[1.55] text-ink-3">{desc}</p>
                    )}

                    <span className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-accent-500 px-5 py-2.5 text-[13px] font-bold text-white shadow-[0_10px_22px_-8px_rgba(240,90,34,0.75)] transition-all duration-300 group-hover:bg-accent-600 md:mt-auto">
                      {cta}
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </div>
                </a>
              </MotionStaggerItem>
            );
          })}
        </MotionStagger>
      </Container>
    </Section>
  );
}
