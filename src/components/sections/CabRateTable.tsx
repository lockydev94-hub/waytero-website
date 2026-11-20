import Link from "next/link";
import { ArrowRight, Check, Clock } from "lucide-react";
import {
  inr,
  standardPackage,
  type CabPriceClass,
  type CabPricePackage,
} from "@/lib/cabPrices";
import { citySlug } from "@/lib/citySlug";

/* ============================================================
   CabRateTable — category-wise card prices, one rental product.

   Shared by /cabs/prices and the /cabs/{trip} landing pages. Both read the
   rate card through /public/cab/cities/{id}/price-list, which is the same
   sheet checkout charges from, so the two pages cannot quote different
   prices for the same class. The table is server-rendered; the only
   interaction is the Book link.
   ============================================================ */

function inclusions(pkg: CabPricePackage): string[] {
  const out: string[] = [];
  if (Number(pkg.driver_allowance) > 0) {
    out.push(`Driver allowance ${inr(pkg.driver_allowance)}`);
  } else {
    out.push("Driver allowance included");
  }
  if (pkg.toll_included) out.push("Toll included");
  if (pkg.parking_included) out.push("Parking included");
  if (pkg.night_halt_included) out.push("Night halt included");
  if (Number(pkg.midnight_return_charge) > 0) {
    out.push(`Midnight return ${inr(pkg.midnight_return_charge)}`);
  }
  return out;
}

export default function CabRateTable({
  classes,
  rentalType,
  cityName,
}: {
  classes: CabPriceClass[];
  rentalType: string;
  cityName?: string | null;
  /** Kept in the contract for callers that label the product; links now go
   *  to the city's canonical price page rather than a query-string search. */
  tripType: string;
}) {
  const rows = classes
    .map((cls) => ({
      cls,
      packages: cls.packages.filter((p) => p.rental_type === rentalType),
    }))
    .filter((r) => r.packages.length > 0);

  if (rows.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-2xl border border-ink-7 bg-white shadow-wt-sm">
      <table className="w-full min-w-[820px] border-collapse text-left">
        <thead>
          <tr className="border-b border-ink-7 bg-ink-9/60 text-[11px] uppercase tracking-[0.1em] text-ink-4">
            <th className="px-4 py-3 font-extrabold">Vehicle</th>
            <th className="px-4 py-3 font-extrabold">Seats</th>
            <th className="px-4 py-3 font-extrabold">Included</th>
            <th className="px-4 py-3 font-extrabold">Price</th>
            <th className="px-4 py-3 font-extrabold">Extra</th>
            <th className="px-4 py-3 font-extrabold">Fare includes</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map(({ cls, packages }) => {
            const std = standardPackage(packages);
            const others = packages.filter((p) => p !== std);
            return (
              <tr
                key={`${rentalType}-${cls.vehicle_class}`}
                className="border-b border-ink-8 align-top last:border-0"
              >
                <td className="px-4 py-4">
                  <div className="text-sm font-bold text-ink">
                    {cls.vehicle_label}
                  </div>
                  {cls.vehicle_models && (
                    <div className="mt-0.5 max-w-[240px] text-[11px] leading-snug text-ink-4">
                      {cls.vehicle_models}
                    </div>
                  )}
                  {cls.rate_source === "PLATFORM" && (
                    <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-ink-4">
                      Standard card
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 text-sm text-ink-2">
                  {cls.seating_capacity ?? "—"}
                </td>
                <td className="px-4 py-4 text-sm text-ink-2">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-ink-4" />
                    {std.included_hours}h
                  </span>
                  <span className="mx-1 text-ink-4">/</span>
                  {std.included_km} km
                  {rentalType === "DAILY" && (
                    <div className="text-[11px] text-ink-4">per day</div>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="text-lg font-extrabold text-ink">
                    {inr(std.price)}
                  </div>
                  {others.length > 0 && (
                    <div className="mt-1 text-[10.5px] leading-relaxed text-ink-4">
                      Also:{" "}
                      {others
                        .map(
                          (p) =>
                            `${p.included_hours}h/${p.included_km}km ${inr(p.price)}`,
                        )
                        .join(" · ")}
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 text-[11.5px] leading-relaxed text-ink-3">
                  <div>{inr(std.extra_km_rate)}/km</div>
                  <div>{inr(std.extra_hour_rate)}/hour</div>
                </td>
                <td className="px-4 py-4">
                  <ul className="space-y-0.5 text-[11.5px] text-ink-3">
                    {inclusions(std).map((line) => (
                      <li key={line} className="flex items-start gap-1">
                        <Check className="mt-0.5 h-3 w-3 shrink-0 text-success-600" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="px-4 py-4">
                  <Link
                    href={
                      cityName
                        ? `/cabs/prices/${citySlug(cityName)}#${rentalType === "OUTSTATION" ? "outstation" : rentalType === "DAILY" ? "daily" : "local"}`
                        : "/cabs/prices"
                    }
                    className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg bg-ink px-3 py-2 text-[11px] font-bold text-white transition-colors hover:bg-ink-2"
                  >
                    View fares <ArrowRight className="h-3 w-3" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
