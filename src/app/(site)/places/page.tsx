import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Landmark, MapPin, Plane, TrainFront } from "lucide-react";
import { Breadcrumb, Container, Section } from "@/components/ui";
import JsonLd, { breadcrumbList, itemList, webPageSchema } from "@/components/sections/JsonLd";
import { getLandingRefs } from "@/lib/landingIndex";
import { BRAND } from "@/lib/brand";
import { toMetadata } from "@/services/seoService";

// ============================================================
// /places — every place a WayTero cab can start or end in Bhubaneswar.
//
// The place pages are generated one per `places` row; until now the only
// way into them was the sitemap. This is the human index: one page that
// lists all of them, grouped by city, so the landing pages are two clicks
// from the homepage and one from the footer rather than invisible.
// ============================================================

export const revalidate = 300;

const PATH = "/places";

export async function generateMetadata(): Promise<Metadata> {
  const places = await publishedPlaces();
  const city = BRAND.primaryCity;
  return toMetadata(
    {
      title: `Cab Pickup Points in ${city} — Every Place We Serve`,
      description: `Every pickup point WayTero serves in ${city} — the airport, the railway station and the city's temples, caves and heritage sites, each with a published cab fare.`,
      keywords: [
        `cab pickup points ${city}`,
        `cab booking ${city} landmarks`,
        `${city} airport and station cab`,
        `cab to temple ${city}`,
      ],
    },
    PATH,
    places.length === 0 ? { robots: { index: false, follow: true } } : undefined,
  );
}

async function publishedPlaces() {
  const refs = await getLandingRefs();
  return refs.filter((r) => r.page_type === "PLACE_CABS");
}

function iconFor(slug: string) {
  if (slug.includes("airport")) return Plane;
  if (slug.includes("railway") || slug.includes("station")) return TrainFront;
  return Landmark;
}

export default async function PlacesPage() {
  const places = await publishedPlaces();
  if (places.length === 0) notFound();

  const city = BRAND.primaryCity;
  const description = `Every pickup point WayTero serves in ${city} — the airport, the railway station and the city's temples, caves and heritage sites, each with a published cab fare.`;

  return (
    <>
      <JsonLd
        data={webPageSchema({
          name: `Cab pickup points in ${city}`,
          description,
          path: PATH,
          type: "CollectionPage",
        })}
      />
      <JsonLd
        data={itemList(
          `Cab pickup points in ${city}`,
          places.map((p) => ({ name: `Cab to ${p.scope.display_name}`, path: p.canonical_path || `/${p.slug}` })),
        )}
      />
      <JsonLd
        data={breadcrumbList([
          { name: "Home", path: "/" },
          { name: "Places", path: PATH },
        ])}
      />

      <Section bg="white" pad="lg" className="bg-gradient-to-b from-accent-50/60 via-white to-white">
        <Container size="lg">
          <Breadcrumb className="mb-4" items={[{ label: "Places" }]} />
          <span className="inline-flex items-center gap-2 rounded-full border border-accent-100 bg-accent-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-accent-700">
            <MapPin className="h-3.5 w-3.5" /> {places.length} pickup points
          </span>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
            Cab pickup points in <span className="text-primary-600">{city}</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-3">
            The airport and the railway station, the Old Town temples, the caves, the zoo and the
            day trips outside the city. Every one is priced from the published {city} rate card —
            the fare you see before you confirm is the fare you pay.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/cabs"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 px-6 py-3.5 text-sm font-bold text-white shadow-wt-primary transition-all hover:-translate-y-0.5"
            >
              Book a cab <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/cabs/prices/bhubaneswar"
              className="inline-flex items-center gap-2 rounded-xl border border-ink-7 bg-white px-6 py-3.5 text-sm font-bold text-ink-2 transition-all hover:border-primary-300 hover:text-primary-700"
            >
              See the fare list
            </Link>
          </div>
        </Container>
      </Section>

      <Section bg="white" pad="md">
        <Container size="wide">
          <h2 className="text-2xl font-extrabold tracking-tight text-ink">Places we serve</h2>
          <p className="mt-1 text-sm text-ink-3">
            Each place has its own page with the distance, what to expect on arrival and the cab
            options for that trip.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {places.map((p) => {
              const Icon = iconFor(p.slug);
              const href = p.canonical_path || `/${p.slug}`;
              return (
                <Link
                  key={p.slug}
                  href={href}
                  className="group flex h-full items-center gap-3 rounded-2xl border border-ink-7 bg-white p-4 transition-all duration-300 ease-[var(--ease-wt)] hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-wt-lg"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-600/10 text-primary-700 transition-colors group-hover:bg-primary-600 group-hover:text-white">
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-extrabold text-ink group-hover:text-primary-700">
                      {p.scope.display_name}
                    </span>
                    <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-ink-4">
                      <MapPin className="h-3 w-3" />
                      Cab pickup &amp; drop
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-ink-4 transition-transform group-hover:translate-x-0.5 group-hover:text-primary-600" />
                </Link>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section bg="muted" pad="md">
        <Container size="lg">
          <h2 className="text-xl font-extrabold text-ink">Planning the rest of the trip</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Link
              href="/cabs/routes"
              className="rounded-2xl border border-ink-7 bg-white p-5 text-sm font-bold text-ink transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:text-primary-700"
            >
              Outstation routes <ArrowRight className="ml-1 inline h-4 w-4" />
            </Link>
            <Link
              href="/tours"
              className="rounded-2xl border border-ink-7 bg-white p-5 text-sm font-bold text-ink transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:text-primary-700"
            >
              Tour packages <ArrowRight className="ml-1 inline h-4 w-4" />
            </Link>
            <Link
              href={`/${BRAND.primaryCity.toLowerCase()}`}
              className="rounded-2xl border border-ink-7 bg-white p-5 text-sm font-bold text-ink transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:text-primary-700"
            >
              Everything in {city} <ArrowRight className="ml-1 inline h-4 w-4" />
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}
