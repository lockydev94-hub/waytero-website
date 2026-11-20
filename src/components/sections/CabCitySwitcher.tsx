"use client";

import { useRouter } from "next/navigation";
import type { CabCityRow } from "@/lib/cabCity";
import { citySlug } from "@/lib/citySlug";

// ── City switcher for the cab price pages ───────────────────────────────────
// Prices are per city, so the switch is a navigation rather than a fetch: each
// city's prices get a real, shareable URL and the page stays server-rendered.
export default function CabCitySwitcher({
  cities,
  cityName,
  basePath = "/cabs/prices",
}: {
  cities: CabCityRow[];
  cityName: string | null;
  basePath?: string;
}) {
  const router = useRouter();

  return (
    <label className="inline-flex flex-wrap items-center gap-2 rounded-2xl border border-ink-7 bg-white px-3.5 py-2.5 shadow-wt-sm">
      <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-4">
        Prices in
      </span>
      <select
        value={cityName ? citySlug(cityName) : ""}
        onChange={(e) => {
          const next = e.target.value;
          if (next) router.push(`${basePath}/${next}`, { scroll: false });
        }}
        className="h-9 min-w-[190px] rounded-lg border border-ink-7 bg-white px-2.5 text-sm font-semibold text-ink focus:border-primary-500 focus:outline-none"
        aria-label="Choose a city to see its cab prices"
      >
        {cities.map((c) => (
          <option key={c.id} value={citySlug(c.name)}>
            {c.name}
            {c.state_name ? ` · ${c.state_name}` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
