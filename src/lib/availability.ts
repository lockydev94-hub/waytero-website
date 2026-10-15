// ============================================================
// Availability — one server-side snapshot of what the platform
// can actually deliver (GET /public/availability): is the service
// enabled AND does it have real supply. Disabled or supply-less
// verticals are hidden site-wide and their URLs 404 (owner
// decision: honest absence beats "coming soon" fakery).
//
// Fail-OPEN on fetch error: a backend blip must not 404 the whole
// site. The signal is advisory for links/sections and only gates
// page-level notFound() when the backend answered definitively.
// ============================================================

import { cache } from "react";
import { API_BASE } from "./apiBase";

export type ServiceKey = "CAB" | "HOTEL" | "TOUR";

export interface ServiceAvailability {
  active: boolean;
  supply_count: number;
  city_ids: number[];
}

export interface AvailabilitySnapshot {
  services: Record<ServiceKey, ServiceAvailability>;
}

const ALL_OK: AvailabilitySnapshot = {
  services: {
    CAB: { active: true, supply_count: 1, city_ids: [] },
    HOTEL: { active: true, supply_count: 1, city_ids: [] },
    TOUR: { active: true, supply_count: 1, city_ids: [] },
  },
};

export const getAvailability = cache(async (): Promise<AvailabilitySnapshot> => {
  try {
    const res = await fetch(`${API_BASE}/public/availability`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return ALL_OK;
    const data = (await res.json()) as AvailabilitySnapshot;
    if (!data?.services || !data.services.CAB || !data.services.HOTEL || !data.services.TOUR) {
      return ALL_OK;
    }
    return data;
  } catch {
    return ALL_OK;
  }
});

/** A vertical is visible only when enabled AND it has real supply. */
export function serviceVisible(av: AvailabilitySnapshot, key: ServiceKey): boolean {
  const s = av.services[key];
  return !!s && s.active && s.supply_count > 0;
}

export function hiddenServices(av: AvailabilitySnapshot): ServiceKey[] {
  return (["CAB", "HOTEL", "TOUR"] as ServiceKey[]).filter((k) => !serviceVisible(av, k));
}

/** Service verticals → their site paths. Used by header/footer/homepage
 *  link filtering so hidden verticals are never advertised. */
export const SERVICE_PATHS: Record<ServiceKey, string> = {
  CAB: "/cabs",
  HOTEL: "/hotels",
  TOUR: "/tours",
};

/** True when a (possibly CMS-configured) href points into a hidden
 *  vertical, e.g. "/tours/konark-sun-temple" when TOUR is hidden. */
export function isHiddenHref(
  href: string | null | undefined,
  hidden: ServiceKey[],
): boolean {
  if (!href || hidden.length === 0) return false;
  return hidden.some((k) => {
    const p = SERVICE_PATHS[k];
    return href === p || href.startsWith(p + "/");
  });
}
