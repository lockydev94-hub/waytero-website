import Link from "next/link";
import { Building2, MapPin } from "lucide-react";
import { Container, Section, SectionHeader, MotionGlow } from "@/components/ui";
import { MotionStagger, MotionStaggerItem } from "@/components/ui";
import { pick, type BandTone } from "@/types/cms";
import { API_BASE } from "@/lib/apiBase";
import { getLandingRefs, type LandingRef } from "@/lib/landingIndex";

/* ============================================================
   WayTero — homepage "Popular Cities" band

   Data source: GET /public/cab/cities — only cities that are active and
   can actually quote a cab (vehicle_count > 0) are listed. A pill links
   to that city's published landing page, or to the tours list filtered to
   the city when none exists, so it never points at a 404.
   ============================================================ */

interface PublicCity {
  id: number;
  name: string;
  state_name?: string | null;
  vehicle_count?: number;
}

/** Which published page best represents a city — hub first, then cabs. */
const PAGE_PREFERENCE: LandingRef["page_type"][] = ["CITY_HUB", "CITY_CABS", "CITY_TOURS", "CITY_HOTELS"];

function cityHref(refs: LandingRef[], city: PublicCity): string {
  const key = city.name.trim().toLowerCase();
  const forCity = refs.filter((r) => r.scope?.kind === "city" && r.scope.display_name?.trim().toLowerCase() === key);
  for (const pageType of PAGE_PREFERENCE) {
    const hit = forCity.find((r) => r.page_type === pageType);
    if (hit) return `/${hit.slug}`;
  }
  // No published landing page for this city yet. The tours list filtered to
  // the city still means what the pill says; a bare /tours would not.
  const q = new URLSearchParams({ city_id: String(city.id), destination: city.name });
  return `/tours?${q.toString()}`;
}

export default async function PopularCitiesSection({
  variant,
  bg = "muted",
}: {
  variant: Record<string, unknown>;
  bg?: BandTone;
}) {
  const eyebrow = pick<string>(variant, "variant_tag", "We operate here");
  const title = pick<string>(variant, "headline", "Popular Cities");
  const subtitle = pick<string>(
    variant,
    "subheadline",
    "Cities where WayTero has bookable supply today.",
  );

  let cities: PublicCity[] = [];
  try {
    const res = await fetch(`${API_BASE}/public/cab/cities`, { next: { revalidate: 300 } });
    if (res.ok) {
      const data = (await res.json()) as unknown;
      const raw = Array.isArray(data) ? data : ((data as { items?: PublicCity[] })?.items ?? []);
      cities = (raw as PublicCity[]).filter((c) => !!c?.name && Number(c.vehicle_count ?? 0) > 0);
    }
  } catch {
    cities = [];
  }

  const refs = await getLandingRefs();
  // No city with supply → omit the band rather than list places we cannot
  // serve (owner rule).
  if (cities.length === 0) return null;

  return (
    <Section bg={bg} pad="home" id="cities" overlay="grid-faint">
      <Container size="wide">
        <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} accent="primary" underline animatedEyebrow scale="home" />
        <MotionStagger className="flex flex-wrap justify-center gap-2.5">
          {cities.slice(0, 18).map((c) => (
            <MotionStaggerItem key={c.id}>
              <MotionGlow color="primary" intensity={0.15} size={200} className="rounded-full">
                <Link
                  href={cityHref(refs, c)}
                  className="group inline-flex items-center gap-2 rounded-full border border-ink-7 bg-white px-4 py-2.5 transition-all duration-300 ease-[var(--ease-wt)] hover:-translate-y-0.5 hover:border-primary-300 hover:bg-primary-50/50 hover:shadow-wt-lg"
                >
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-primary-600/10 text-primary-700 transition-colors group-hover:bg-primary-600 group-hover:text-white">
                    <Building2 className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-[13px] font-bold text-ink group-hover:text-primary-700">{c.name}</span>
                  {c.state_name && (
                    <span className="inline-flex items-center gap-0.5 text-[11px] text-ink-4">
                      <MapPin className="h-3 w-3" />
                      {c.state_name}
                    </span>
                  )}
                </Link>
              </MotionGlow>
            </MotionStaggerItem>
          ))}
        </MotionStagger>
      </Container>
    </Section>
  );
}
