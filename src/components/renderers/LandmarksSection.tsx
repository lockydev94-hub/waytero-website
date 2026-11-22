import Link from "next/link";
import { ArrowRight, Landmark, MapPin, Plane, TrainFront } from "lucide-react";
import { Container, MotionStagger, MotionStaggerItem, Section, SectionHeader } from "@/components/ui";
import type { BandTone } from "@/types/cms";
import type { LandingRef } from "@/lib/landingIndex";

/* ============================================================
   WayTero — homepage "Places we serve" band

   The place pages (airport, railway station, temples, the zoo, the caves)
   were only reachable from the sitemap: nothing on the site linked them in
   bulk, so they were orphans at the crawl level. This band sits directly
   under the tours band and shows the first few, with the rest behind
   /places — one hop from the homepage to every pickup point we sell.
   ============================================================ */

/** Enough to show the idea without pushing the rest of the page down. */
const HOMEPAGE_LIMIT = 6;

type Props = {
  places: LandingRef[];
  bg?: BandTone;
};

function iconFor(slug: string) {
  if (slug.includes("airport")) return Plane;
  if (slug.includes("railway") || slug.includes("station")) return TrainFront;
  return Landmark;
}

export default function LandmarksSection({ places, bg = "white" }: Props) {
  if (places.length === 0) return null;

  const shown = places.slice(0, HOMEPAGE_LIMIT);
  const rest = places.length - shown.length;

  return (
    <Section bg={bg} pad="home" id="places" overlay="grid-faint">
      <Container size="wide">
        <SectionHeader
          eyebrow="Places we serve"
          title="Cab pickups across Bhubaneswar"
          subtitle="Fixed-price pickups from the airport, the railway station and the city's temples, caves and heritage sites — the fare is the published rate card, not a meter."
          accent="primary"
          underline
          animatedEyebrow
          scale="home"
        />
        <MotionStagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p) => {
            const Icon = iconFor(p.slug);
            return (
              <MotionStaggerItem key={p.slug}>
                <Link
                  href={p.canonical_path || `/${p.slug}`}
                  className="group flex h-full items-center gap-3 rounded-2xl border border-ink-7 bg-white p-4 transition-all duration-300 ease-[var(--ease-wt)] hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-wt-lg"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-600/10 text-primary-700 transition-colors group-hover:bg-primary-600 group-hover:text-white">
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-extrabold text-ink group-hover:text-primary-700">
                      {p.scope.display_name}
                    </span>
                    <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-ink-4">
                      <MapPin className="h-3 w-3" />
                      {p.scope.city_name ?? "Bhubaneswar"} cab pickup
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-ink-4 transition-transform group-hover:translate-x-0.5 group-hover:text-primary-600" />
                </Link>
              </MotionStaggerItem>
            );
          })}
        </MotionStagger>

        <div className="mt-6 flex justify-center">
          <Link
            href="/places"
            className="group inline-flex items-center gap-2 rounded-xl border border-ink-7 bg-white px-5 py-3 text-sm font-bold text-ink transition-all hover:border-primary-300 hover:text-primary-700"
          >
            {rest > 0 ? `View all ${places.length} places` : "View all places"}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </Container>
    </Section>
  );
}
