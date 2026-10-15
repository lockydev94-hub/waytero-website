"use client";

// ============================================================
// UseMyLocationOption — the opt-in "Use my location" row inside
// the city pickers (CabSearchForm chip + hero CityChip).
//
// Contract:
//  • NEVER auto-prompts — the browser dialog only appears on an
//    explicit click (owner decision: no prompt fatigue).
//  • One navigator.geolocation call → backend nearest-city match
//    (same /public/cab/cities/match path the booking flow uses,
//    so only serviceable cities can be selected).
//  • Remembers that the customer tried (sessionStorage) so a
//    denied/failed attempt doesn't invite repeated clicks.
// ============================================================

import { useState } from "react";
import { Crosshair, Loader2 } from "lucide-react";
import { cabService, type PublicCity } from "@/services/cabService";
import { markGeoAsked } from "@/lib/placeIntent";
import { outOfServiceArea } from "@/lib/serviceArea";

export default function UseMyLocationOption({
  onCity,
  onClose,
}: {
  onCity: (city: PublicCity) => void;
  onClose?: () => void;
}) {
  const [state, setState] = useState<"idle" | "finding" | "none">("idle");

  const find = async () => {
    if (!("geolocation" in navigator)) {
      setState("none");
      return;
    }
    markGeoAsked();
    setState("finding");
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 8000,
          maximumAge: 5 * 60 * 1000,
        }),
      );
      const city = await cabService.matchNearestCity(
        pos.coords.latitude,
        pos.coords.longitude,
      );
      // "Nearest active city" answers for any coordinates in India — a
      // customer far outside service range gets the honest not-detected
      // state rather than being silently mapped to Bhubaneswar.
      if (city && !outOfServiceArea(city, pos.coords.latitude, pos.coords.longitude)) {
        onCity(city);
        onClose?.();
        setState("idle");
      } else {
        setState("none");
      }
    } catch {
      setState("none");
    }
  };

  return (
    <li>
      <button
        type="button"
        onClick={find}
        disabled={state === "finding"}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-primary-700 hover:bg-primary-50 transition-colors border-b border-ink-8 font-semibold"
      >
        {state === "finding" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#F05A22] flex-shrink-0" />
        ) : (
          <Crosshair className="h-3.5 w-3.5 text-[#F05A22] flex-shrink-0" />
        )}
        <span>
          {state === "finding"
            ? "Finding your city…"
            : state === "none"
              ? "Couldn't detect — pick a city below"
              : "Use my location"}
        </span>
      </button>
    </li>
  );
}
