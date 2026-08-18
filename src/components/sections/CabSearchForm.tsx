"use client";

/**
 * CabSearchForm — Premium cab search widget used in hero + /cabs page
 *
 * Features:
 *  • Google Maps Places Autocomplete (key resolved from /public/cab/google-maps-key,
 *    falling back to NEXT_PUBLIC_GOOGLE_MAPS_KEY env)
 *  • Falls back to city dropdown (from /public/cab/cities) when Maps API is unavailable
 *  • Auto-computes distance via Distance Matrix when both pickup and drop have lat/lng
 *  • Resolves city_id (from city picker or via Google geocoding reverse lookup)
 *  • Custom date + time picker (no native datetime-local ugly input)
 *  • Trip type selector: LOCAL | OUTSTATION | AIRPORT | ROUND_TRIP
 *  • Passenger count picker
 *  • On submit → /cabs/results?pickup=...&drop=...&city_id=...&trip_type=...&date=...&time=...&pax=...&distance_km=...
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  MapPin, Navigation, ChevronDown, Calendar, Clock,
  Users, ArrowRight, Repeat2, Plane, Car, Search,
} from "lucide-react";
import { cabService, type PublicCity, type PublicTripType } from "@/services/cabService";

// ── Types ─────────────────────────────────────────────────────────────────────
interface PlaceSuggestion {
  place_id: string;
  description: string;
  lat?: number;
  lng?: number;
}

interface LocationValue {
  label: string;
  place_id?: string;
  lat?: number;
  lng?: number;
  city_id?: number;
  city_name?: string;
}

// Backend-driven trip types are fetched at runtime (see CabSearchForm).
// Icon map used when the backend sends an icon hint.
const TRIP_ICON_MAP: Record<string, typeof Car> = {
  Car, Plane, Navigation, ArrowRight, Repeat2,
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

async function fetchGoogleMapsKey(): Promise<string | null> {
  const envKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  try {
    const data = await cabService.getGoogleMapsKey();
    return data?.api_key || envKey || null;
  } catch {
    return envKey || null;
  }
}

/** Haversine straight-line distance (km) between two points. */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Resolve road distance (km) via Google Distance Matrix. Falls back to the
 * haversine straight-line × 1.25 road factor when the Matrix service isn't
 * available (no Maps script or offline), so the results page still gets a
 * usable estimate.
 */
async function resolveDistanceKm(
  plat: number, plng: number, dlat: number, dlng: number,
): Promise<number> {
  try {
    const svc = new google.maps.DistanceMatrixService();
    const res = await new Promise<google.maps.DistanceMatrixResponse>((resolve, reject) => {
      svc.getDistanceMatrix(
        {
          origins: [{ lat: plat, lng: plng }],
          destinations: [{ lat: dlat, lng: dlng }],
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.METRIC,
        },
        (r, status) => (status === google.maps.DistanceMatrixStatus.OK && r ? resolve(r) : reject(new Error(status))),
      );
    });
    const km = res.rows?.[0]?.elements?.[0]?.distance?.value;
    if (typeof km === "number" && km > 0) return Math.round((km / 1000) * 10) / 10;
  } catch {
    // fall through to haversine
  }
  return Math.round(haversineKm(plat, plng, dlat, dlng) * 1.25 * 10) / 10;
}

/**
 * Reverse-geocode lat/lng to a city name (Maps mode) and match it against the
 * backend city list so the fare-estimate can be priced per-city.
 */
async function resolveCityIdFromCoords(
  lat: number,
  lng: number,
  cities: PublicCity[],
): Promise<number | undefined> {
  if (!cities.length) return undefined;
  try {
    const geocoder = new google.maps.Geocoder();
    const res = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
      geocoder.geocode({ location: { lat, lng } }, (results, status) =>
        status === "OK" && results ? resolve(results) : reject(new Error(status)),
      );
    });
    const addr = res[0]?.address_components ?? [];
    const names = addr
      .filter((c) =>
        ["locality", "administrative_area_level_2", "administrative_area_level_1", "postal_town", "sublocality_level_1"].includes(c.types[0] ?? ""),
      )
      .map((c) => c.long_name.toLowerCase());
    const hit = cities.find((c) =>
      names.some((n) => c.name.toLowerCase().includes(n) || n.includes(c.name.toLowerCase())),
    );
    return hit?.id;
  } catch {
    return undefined;
  }
}

// ── Two-step date + time picker (same UX as the home-page hero picker) ────────
//
// Opens as a centered modal dialog portaled to document.body so it escapes the
// form's overflow-hidden shell. Unlike the old viewport-anchored popover it
// NEVER closes on scroll — the panel is a fixed full-screen layer, so page
// scrolling cannot misalign it (body scroll is locked while it is open).
//
// Flow is two steps, exactly as the UX asks:
//   1. "date" — a responsive calendar; picking a day auto-advances to time.
//   2. "time" — hour/minute controls with a "Change date" back link.
// Confirm commits to the parent; backdrop / ✕ / Esc cancels without writing.
function DateTimePicker({
  value, onChange, label, minDate,
}: {
  value: { date: Date | null; hour: number; minute: number };
  onChange: (v: { date: Date | null; hour: number; minute: number }) => void;
  label: string;
  minDate?: Date;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"date" | "time">("date");
  const [viewMonth, setViewMonth] = useState(() => value.date ?? new Date());
  // Working copy edited inside the modal — nothing reaches the parent until
  // the user presses Confirm.
  const [draft, setDraft] = useState({ date: value.date, hour: value.hour, minute: value.minute });

  const close = () => setOpen(false);

  // Lock page scroll while the modal is open and close on Esc.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const openPicker = () => {
    // Seed the working copy from the current value. With no date yet, default
    // to today + now (rounded to the nearest 15 min) so the calendar opens
    // with today highlighted — but only when that falls within minDate.
    const now = new Date();
    const minute = Math.min(45, Math.max(0, Math.round(now.getMinutes() / 15) * 15));
    const hasValidDefault = !!value.date || (minDate ? now >= minDate : true);
    setDraft({
      date: value.date ?? (hasValidDefault ? now : null),
      hour: value.date ? value.hour : now.getHours(),
      minute: value.date ? value.minute : minute,
    });
    // Already have a date? Jump straight to time so re-opening is one tap;
    // otherwise start on the date step (date → time, as requested).
    setStep(value.date ? "time" : "date");
    setViewMonth(value.date ?? new Date());
    setOpen(true);
  };

  const today = new Date(); today.setHours(0,0,0,0);
  const min   = minDate ?? today;
  const startOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const daysInMonth  = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const startDay     = startOfMonth.getDay();
  const prevMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  const nextMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));

  // Two-step: picking a day immediately moves on to the time step.
  const selectDay = (d: number) => {
    setDraft({ ...draft, date: new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d) });
    setStep("time");
  };

  const confirm = () => {
    onChange({ date: draft.date, hour: draft.hour, minute: draft.minute });
    close();
  };

  const displayStr = value.date
    ? `${value.date.getDate()} ${MONTHS[value.date.getMonth()]} ${value.date.getFullYear()}, ${String(value.hour).padStart(2,"0")}:${String(value.minute).padStart(2,"0")}`
    : label;

  const modal = (
    <div data-portal-picker role="dialog" aria-modal="true" aria-label={label}
      className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop — clicking it cancels without saving. */}
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={close} />

      <div className="relative w-full sm:w-[380px] max-w-[94vw] rounded-t-3xl sm:rounded-3xl bg-white shadow-[0_30px_80px_rgba(11,27,59,0.35)] border border-ink-7 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 pt-4 pb-3 border-b border-ink-8 bg-white">
          <div className="flex items-center gap-2">
            {step === "time" ? (
              <button type="button" onClick={() => setStep("date")} aria-label="Change date"
                className="h-8 w-8 rounded-lg hover:bg-ink-9 flex items-center justify-center text-ink-3 text-lg">‹</button>
            ) : (
              <Calendar className="h-4 w-4 text-[#F05A22]" />
            )}
            <span className="text-sm font-bold text-ink">
              {step === "date" ? `Select ${label}` : "Select time"}
            </span>
          </div>
          <button type="button" onClick={close} aria-label="Close"
            className="h-8 w-8 rounded-lg hover:bg-ink-9 flex items-center justify-center text-ink-3">✕</button>
        </div>

        {step === "date" ? (
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <button type="button" onClick={prevMonth} className="h-9 w-9 rounded-lg hover:bg-ink-9 flex items-center justify-center text-ink-3 text-xl">‹</button>
              <span className="text-sm font-bold text-ink">{MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}</span>
              <button type="button" onClick={nextMonth} className="h-9 w-9 rounded-lg hover:bg-ink-9 flex items-center justify-center text-ink-3 text-xl">›</button>
            </div>
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map(d => <div key={d} className="text-center text-[10px] font-semibold text-ink-4 py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: startDay }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const d  = i + 1;
                const dt = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d);
                dt.setHours(0,0,0,0);
                const past = dt < min;
                const sel  = draft.date && dt.toDateString() === draft.date.toDateString();
                return (
                  <button key={d} type="button" disabled={past} onClick={() => selectDay(d)}
                    className={`h-9 w-full rounded-lg text-xs font-medium transition-all
                      ${past ? "text-ink-6 cursor-not-allowed" : "hover:bg-primary-50 cursor-pointer"}
                      ${sel ? "bg-[#F05A22] text-white hover:bg-[#E04A12]" : "text-ink"}`}>
                    {d}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-ink-8 flex items-center justify-between gap-3">
              <span className="text-xs text-ink-4">Pick a day to set the time.</span>
              <button type="button" disabled={!draft.date} onClick={() => setStep("time")}
                className="h-9 px-5 rounded-xl bg-[#F05A22] text-white text-sm font-bold hover:bg-[#E04A12] disabled:opacity-40 disabled:cursor-not-allowed">
                Continue
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5">
            {/* Chosen date summary — Change returns to the date step. */}
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-primary-50 border border-primary-100 mb-4">
              <Calendar className="h-4 w-4 text-[#F05A22] flex-shrink-0" />
              <span className="text-sm font-bold text-ink">
                {draft.date ? `${draft.date.getDate()} ${MONTHS[draft.date.getMonth()]} ${draft.date.getFullYear()}` : "Pick a date"}
              </span>
              <button type="button" onClick={() => setStep("date")} className="ml-auto text-xs font-semibold text-[#F05A22] hover:underline">Change</button>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-[#F05A22]" />
              <span className="text-xs font-semibold text-ink">Time</span>
            </div>
            <div className="flex items-center gap-3">
              <select value={draft.hour} onChange={e => setDraft({ ...draft, hour: +e.target.value })}
                className="flex-1 h-11 rounded-xl border border-ink-7 bg-ink-9 text-sm px-2">
                {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2,"0")}</option>)}
              </select>
              <span className="font-bold text-ink">:</span>
              <select value={draft.minute} onChange={e => setDraft({ ...draft, minute: +e.target.value })}
                className="flex-1 h-11 rounded-xl border border-ink-7 bg-ink-9 text-sm px-2">
                {[0,15,30,45].map(m => <option key={m} value={m}>{String(m).padStart(2,"0")}</option>)}
              </select>
            </div>

            <button type="button" disabled={!draft.date} onClick={confirm}
              className="mt-4 w-full h-11 rounded-xl bg-[#F05A22] text-white text-sm font-bold hover:bg-[#E04A12] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Confirm
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={openPicker}
        className="w-full flex items-center gap-2 text-left"
      >
        <Calendar className="h-4 w-4 text-[#F05A22] flex-shrink-0" />
        <span className={`text-sm font-medium truncate ${value.date ? "text-ink" : "text-ink-4"}`}>
          {displayStr}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-ink-4 ml-auto flex-shrink-0" />
      </button>

      {open && typeof document !== "undefined" && createPortal(modal, document.body)}
    </>
  );
}

// ── Location Input with Google Maps or City Fallback ─────────────────────────
function LocationInput({
  value, onChange, placeholder, icon: Icon, cities, useCityMode, mapsKey, selectedCity,
}: {
  value: LocationValue;
  onChange: (v: LocationValue) => void;
  placeholder: string;
  icon: typeof MapPin;
  cities: PublicCity[];
  useCityMode: boolean;
  mapsKey?: string | null;
  /** Currently-selected city — biases Google Places predictions so
   *  suggestions come from the customer's city, not from anywhere in
   *  the country. */
  selectedCity?: PublicCity | null;
}) {
  const [query, setQuery]           = useState(value.label);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen]             = useState(false);
  const [loading, setLoading]       = useState(false);
  const [locked, setLocked]         = useState(!!value.place_id);
  const debounceRef                 = useRef<ReturnType<typeof setTimeout>>();
  const reqId                       = useRef(0);
  const ref                         = useRef<HTMLDivElement>(null);
  const autocompleteService         = useRef<google.maps.places.AutocompleteService | null>(null);
  const geocoder                    = useRef<google.maps.Geocoder | null>(null);
  const sessionToken                = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  // Anchor rect for the portal'd dropdown — see HeroSearchForm for the
  // same pattern; this escapes any `overflow-hidden` ancestor.
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      // Ignore clicks on the portaled dropdown — it lives on document.body,
      // outside `ref`, so a naive contains() check would close the dropdown
      // on mousedown and the click would never reach a suggestion.
      if (target && (target as Element).closest?.("[data-portal-dropdown]")) return;
      if (ref.current && !ref.current.contains(target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Init Google Maps services once script loads
  useEffect(() => {
    if (!mapsKey || useCityMode) return;
    if (typeof window !== "undefined" && (window as any).google?.maps?.places) {
      autocompleteService.current = new google.maps.places.AutocompleteService();
      geocoder.current            = new google.maps.Geocoder();
    }
  }, [mapsKey, useCityMode]);

  // Keep local query state in sync when the parent resets the value
  // (e.g. when selectSuggestion's async geocode completes and pushes the
  // resolved label back down via onChange). Without this, the input can
  // keep showing the typed text even though value.label has been updated.
  useEffect(() => {
    setQuery(value.label);
    setLocked(!!value.place_id);
  }, [value.label, value.place_id]);

  // Track the input's position so the portaled dropdown stays anchored.
  useEffect(() => {
    if (!open || !ref.current) return;
    const updateRect = () => {
      const r = ref.current?.getBoundingClientRect();
      if (r) setDropdownRect({ top: r.bottom + 8, left: r.left, width: r.width });
    };
    updateRect();
    window.addEventListener("scroll", updateRect, true);
    window.addEventListener("resize", updateRect);
    return () => {
      window.removeEventListener("scroll", updateRect, true);
      window.removeEventListener("resize", updateRect);
    };
  }, [open]);

  const fetchSuggestions = useCallback((q: string) => {
    if (!q || useCityMode) return;
    if (!autocompleteService.current) return;
    const myId = ++reqId.current;
    setLoading(true);
    // New session token per Places billing transaction; killed when user picks.
    if (!sessionToken.current) {
      sessionToken.current = new google.maps.places.AutocompleteSessionToken();
    }
    // Bias to the customer's selected city so "Bhubaneswar Airport" outranks
    // "Bihar, India" — the bug in the customer screenshot.
    const bias = (() => {
      const c = selectedCity;
      if (!c || c.latitude == null || c.longitude == null) return null;
      return {
        location: new google.maps.LatLng(c.latitude, c.longitude),
        radius: 25000,
        strictBounds: true,
      };
    })();
    autocompleteService.current.getPlacePredictions(
      {
        input: q,
        sessionToken: sessionToken.current,
        componentRestrictions: { country: "IN" },
        ...(bias ?? {}),
      },
      (preds, status) => {
        // Ignore stale responses — only the latest request updates UI.
        if (myId !== reqId.current) return;
        setLoading(false);
        if (status === google.maps.places.PlacesServiceStatus.OK && preds) {
          setSuggestions(preds.map(p => ({
            place_id: p.place_id,
            description: p.description,
          })));
          setOpen(true);
        } else {
          setSuggestions([]);
        }
      },
    );
  }, [useCityMode, selectedCity]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (locked) return;
    const q = e.target.value;
    // Lock to a single character of free input. Anything beyond that
    // would create overlapping Places requests (the source of the
    // "Reporting Header: invalid JSON value received" console warning).
    if (q.length > 1) {
      setQuery(q);
      setOpen(true); // keep dropdown open so the user picks from existing suggestions
      return;
    }
    setQuery(q);
    onChange({ label: q });
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(q), 250);
  };

  const selectSuggestion = async (s: PlaceSuggestion) => {
    // Push the picked place to the parent IMMEDIATELY so the input fills
    // and validation clears on the next render. The sync effect (below)
    // keeps local query in sync with value.label, so the input reflects
    // this immediately even if the geocode later updates the value.
    onChange({ label: s.description, place_id: s.place_id });
    setQuery(s.description);
    setOpen(false);
    setSuggestions([]);
    setLocked(true);

    // Enrich with lat/lng + city in the background. Geocode is slow and
    // can fail — but the user shouldn't have to wait for it to see the
    // pick reflected. The onChange above has already unblocked submit.
    if (geocoder.current) {
      geocoder.current.geocode({ placeId: s.place_id }, async (results, status) => {
        if (status === "OK" && results?.[0]) {
          const loc = results[0].geometry.location;
          const lat = loc.lat(), lng = loc.lng();
          // Derive city_id from coords so the fare-estimate always loads.
          try {
            const city = await cabService.matchNearestCity(lat, lng);
            onChange({
              label: s.description,
              place_id: s.place_id,
              lat, lng,
              city_id: city?.id,
              city_name: city?.name,
            });
          } catch {
            onChange({ label: s.description, place_id: s.place_id, lat, lng });
          }
        }
        sessionToken.current = null;
      });
    } else {
      sessionToken.current = null;
    }
  };

  const clearPick = () => {
    setQuery("");
    setLocked(false);
    setSuggestions([]);
    setOpen(false);
    sessionToken.current = null;
    onChange({ label: "" });
  };

  // City mode
  if (useCityMode) {
    const filteredCities = cities.filter(c =>
      c.name.toLowerCase().includes(query.toLowerCase())
    );
    return (
      <div ref={ref} className="relative w-full">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-[#F05A22] flex-shrink-0" />
          <input
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            className="w-full bg-transparent text-sm font-medium text-ink placeholder:text-ink-4 focus:outline-none"
          />
        </div>
        {open && filteredCities.length > 0 && (
          <div className="absolute top-full left-0 mt-2 z-[200] bg-white rounded-xl shadow-[0_8px_32px_rgba(11,27,59,0.15)] border border-ink-7 overflow-hidden w-64 max-h-60 overflow-y-auto">
            {filteredCities.map(c => (
              <button
                key={c.id} type="button"
                onClick={() => {
                  setQuery(c.name);
                  onChange({ label: c.name, city_id: c.id });
                  setOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink-2 hover:bg-primary-50 hover:text-primary-700 transition-colors text-left"
              >
                <MapPin className="h-3.5 w-3.5 text-ink-4 flex-shrink-0" />
                <div>
                  <div className="font-medium">{c.name}</div>
                  {c.state_name && <div className="text-xs text-ink-4">{c.state_name}</div>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Google Maps mode
  return (
    <div ref={ref} className="relative w-full">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#F05A22] flex-shrink-0" />
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInput}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          readOnly={locked}
          className={`w-full bg-transparent text-sm font-medium text-ink placeholder:text-ink-4 focus:outline-none ${locked ? "cursor-default" : ""}`}
        />
        {loading && (
          <div className="h-3.5 w-3.5 border-2 border-[#F05A22]/30 border-t-[#F05A22] rounded-full animate-spin flex-shrink-0" />
        )}
        {locked && (
          <button type="button" onClick={clearPick} aria-label="Change location"
            className="text-ink-4 hover:text-[#F05A22] flex-shrink-0 text-xs font-bold">
            ✕
          </button>
        )}
      </div>
      {open && suggestions.length > 0 && dropdownRect && typeof document !== "undefined" &&
        createPortal(
          <div
            data-portal-dropdown
            style={{
              position: "fixed",
              top: dropdownRect.top,
              left: dropdownRect.left,
              width: Math.max(dropdownRect.width, 320),
              zIndex: 1000,
            }}
            className="bg-white rounded-xl shadow-[0_8px_32px_rgba(11,27,59,0.15)] border border-ink-7 overflow-hidden max-h-72 overflow-y-auto"
          >
            {suggestions.map(s => (
              <button
                key={s.place_id} type="button"
                onClick={() => selectSuggestion(s)}
                className="w-full flex items-start gap-3 px-4 py-3 text-sm text-ink-2 hover:bg-primary-50 hover:text-primary-700 transition-colors text-left border-b border-ink-8 last:border-0"
              >
                <MapPin className="h-3.5 w-3.5 text-[#F05A22] flex-shrink-0 mt-0.5" />
                <span className="line-clamp-2">{s.description}</span>
              </button>
            ))}
          </div>,
          document.body,
        )
      }
    </div>
  );
}

// ── Field shell ────────────────────────────────────────────────────────────────
// NOTE: defined at module scope (not inside CabSearchForm) so its component
// identity is stable across renders. A component type created inside the
// render body forces React to unmount/remount the whole field subtree on
// every parent re-render, which wiped the LocationInput's state and focus
// after the first keystroke (the "only one letter types" bug on /cabs).
// Mirrors GlassField in HeroSearchForm.
function Field({ children, label, error, className = "" }: {
  children: React.ReactNode; label: string; error?: string; className?: string;
}) {
  return (
    <div className={`${className} flex flex-col justify-center`}>
      <div className={`px-4 py-3 rounded-xl border transition-all
        ${error ? "border-red-300 bg-red-50" : "border-ink-7 bg-white hover:border-primary-300"}`}>
        <div className="text-[10px] font-bold text-ink-4 uppercase tracking-wider mb-1">{label}</div>
        {children}
      </div>
      {error && <p className="text-xs text-red-500 mt-1 px-1">{error}</p>}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
interface CabSearchFormProps {
  variant?: "hero" | "page";  // hero = compact overlay; page = full card
  initialCities?: PublicCity[];
}

export default function CabSearchForm({ variant = "page", initialCities = [] }: CabSearchFormProps) {
  const router     = useRouter();
  const [mapsKey, setMapsKey]     = useState<string | null>(process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? null);
  const [mapsReady, setMapsReady] = useState(false);
  const [cities, setCities]       = useState<PublicCity[]>(initialCities);
  const [tripTypes, setTripTypes] = useState<PublicTripType[]>([]);
  const useCityMode               = !mapsKey || !mapsReady;

  const [tripType, setTripType]   = useState<string>("");
  const [pickup, setPickup]       = useState<LocationValue>({ label: "" });
  const [drop, setDrop]           = useState<LocationValue>({ label: "" });
  const [pax, setPax]             = useState(1);
  const [dateTime, setDateTime]   = useState<{ date: Date | null; hour: number; minute: number }>({
    date: null, hour: 9, minute: 0,
  });
  const [returnDateTime, setReturnDateTime] = useState<{ date: Date | null; hour: number; minute: number }>({
    date: null, hour: 9, minute: 0,
  });
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const [tripTypeOpen, setTripTypeOpen] = useState(false);
  // Currently-selected city — drives the city chip and biases Google
  // Places autocomplete so suggestions stay inside the customer's city.
  const [selectedCity, setSelectedCity] = useState<PublicCity | null>(null);
  const tripTypeRef = useRef<HTMLDivElement>(null);
  const cityChipRef = useRef<HTMLDivElement>(null);
  const [cityChipOpen, setCityChipOpen] = useState(false);
  const [cityChipRect, setCityChipRect] = useState<{ top: number; left: number } | null>(null);

  // Close the city chip on outside click + recompute anchor on open.
  useEffect(() => {
    if (!cityChipOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      // Ignore clicks inside the portaled dropdown — otherwise mousedown
      // closes the chip before the click can reach a city option.
      if (target && (target as Element).closest?.("[data-portal-dropdown]")) return;
      if (!cityChipRef.current?.contains(target)) setCityChipOpen(false);
    };
    document.addEventListener("mousedown", handler);
    const r = cityChipRef.current?.getBoundingClientRect();
    if (r) setCityChipRect({ top: r.bottom + 8, left: r.left });
    return () => document.removeEventListener("mousedown", handler);
  }, [cityChipOpen]);

  // Close city chip on scroll/resize — portal is anchored to viewport coords.
  useEffect(() => {
    if (!cityChipOpen) return;
    const close = () => setCityChipOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [cityChipOpen]);

  // Close trip type dropdown on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (tripTypeRef.current && !tripTypeRef.current.contains(e.target as Node))
        setTripTypeOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Resolve the Google Maps key — admin-configured key from the backend first,
  // NEXT_PUBLIC_GOOGLE_MAPS_KEY as a build-time fallback.
  useEffect(() => {
    if (mapsKey) return;
    fetchGoogleMapsKey().then((key) => {
      if (key) setMapsKey(key);
    });
  }, [mapsKey]);

  // Load Google Maps script
  useEffect(() => {
    if (!mapsKey) return;
    if ((window as any).google?.maps?.places) { setMapsReady(true); return; }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsKey}&libraries=places`;
    script.async = true;
    script.onload  = () => setMapsReady(true);
    script.onerror = () => setMapsReady(false);
    document.head.appendChild(script);
    return () => { try { document.head.removeChild(script); } catch {} };
  }, [mapsKey]);

  // Fetch cities when in city mode
  useEffect(() => {
    if (!useCityMode || cities.length > 0) return;
    cabService.getCities().then(setCities).catch(() => {});
  }, [useCityMode, cities.length]);

  // Pick a default city once the list arrives — Bhubaneswar if present,
  // else first city with lat/lng, else first city. Avoids querying Places
  // with an empty bias while cities load.
  useEffect(() => {
    if (selectedCity || cities.length === 0) return;
    const bbs = cities.find(c => c.city_code === "BBS");
    const withCoords = cities.find(c => c.latitude != null && c.longitude != null);
    setSelectedCity(bbs ?? withCoords ?? cities[0] ?? null);
  }, [cities, selectedCity]);

  // Fetch active trip types — these are the only bookable trip types.
  useEffect(() => {
    cabService.getTripTypes().then((list) => {
      setTripTypes(list);
      setTripType((curr) => curr || list[0]?.code || "");
    }).catch(() => setTripTypes([]));
  }, []);

  const activeTripType = tripTypes.find(t => t.code === tripType);

  // Trip-type-specific field requirements:
  //   LOCAL        — pickup only, no drop required
  //   OUTSTATION   — pickup + drop (one-way inter-city)
  //   ONE_WAY      — pickup + drop (one-way inter-city, explicit)
  //   AIRPORT      — pickup + drop
  //   ROUND_TRIP   — pickup only (return to same pickup), requires return date
  const requiresDrop = tripType === "OUTSTATION" || tripType === "ONE_WAY" || tripType === "AIRPORT";
  const requiresReturnDate = tripType === "ROUND_TRIP";
  const isRoundTrip = tripType === "ROUND_TRIP";

  const validate = () => {
    const e: Record<string, string> = {};
    if (!pickup.label.trim()) e.pickup = "Enter pickup location";
    if (!dateTime.date) e.date = "Select pickup date";
    if (requiresDrop && !drop.label.trim()) e.drop = "Enter drop location";
    if (requiresReturnDate && !returnDateTime.date) {
      e.returnDate = "Select return date";
    } else if (requiresReturnDate && returnDateTime.date && dateTime.date &&
               returnDateTime.date.getTime() <= dateTime.date.getTime()) {
      e.returnDate = "Return date must be after pickup date";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSearch = async () => {
    if (!validate()) return;
    const dt = dateTime.date!;
    const dateStr = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;
    const timeStr = `${String(dateTime.hour).padStart(2,"0")}:${String(dateTime.minute).padStart(2,"0")}`;

    const params = new URLSearchParams({
      trip_type:  tripType,
      pickup:     pickup.label,
      date:       dateStr,
      time:       timeStr,
      pax:        String(pax),
    });
    if (drop.label)    params.set("drop", drop.label);
    if (pickup.lat)    params.set("plat", String(pickup.lat));
    if (pickup.lng)    params.set("plng", String(pickup.lng));
    if (drop.lat)      params.set("dlat", String(drop.lat));
    if (drop.lng)      params.set("dlng", String(drop.lng));
    if (isRoundTrip && returnDateTime.date) {
      const rd = returnDateTime.date;
      params.set("return_date",
        `${rd.getFullYear()}-${String(rd.getMonth()+1).padStart(2,"0")}-${String(rd.getDate()).padStart(2,"0")}`);
      params.set("return_time",
        `${String(returnDateTime.hour).padStart(2,"0")}:${String(returnDateTime.minute).padStart(2,"0")}`);
    }

    // Resolve city_id — value picked in city picker, else backend nearest-city
    // lookup using pickup coords (reliable, doesn't depend on Maps session state).
    let cityId = pickup.city_id;
    if (!cityId && pickup.lat && pickup.lng) {
      try {
        const c = await cabService.matchNearestCity(pickup.lat, pickup.lng);
        cityId = c?.id;
      } catch {
        cityId = undefined;
      }
    }
    if (cityId) params.set("city_id", String(cityId));

    // Auto-compute road distance when both ends have coordinates.
    // Round trip distance = 2× one-way. When only pickup is provided
    // (LOCAL / ROUND_TRIP without drop), use a trip-type default so the
    // results page doesn't hang waiting on `distanceKm` to resolve.
    if (pickup.lat && pickup.lng && drop.lat && drop.lng) {
      const km = await resolveDistanceKm(pickup.lat, pickup.lng, drop.lat, drop.lng);
      params.set("distance_km", String(isRoundTrip ? km * 2 : km));
    } else {
      let defaultKm = 30;
      if (tripType === "LOCAL") {
        defaultKm = 10;
      } else if (isRoundTrip) {
        defaultKm = 50;
      }
      params.set("distance_km", String(defaultKm));
    }

    router.push(`/cabs/results?${params.toString()}`);
  };

  const isHero = variant === "hero";

  return (
    <div className={`${isHero ? "" : "bg-white rounded-3xl border border-ink-7 shadow-wt-lg p-6"}`}>
      {/* "Searching in <city> ▾" chip — biases Google Places autocomplete
          so suggestions stay within the selected city. */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-[10px] font-bold text-ink-4 uppercase tracking-wider mr-1">
          Searching in
        </span>
        <div ref={cityChipRef} className="relative">
          <button
            type="button"
            onClick={() => setCityChipOpen(v => !v)}
            aria-haspopup="listbox"
            aria-expanded={cityChipOpen}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-ink-7 text-ink text-xs font-semibold hover:border-[#F05A22]/40 hover:text-[#F05A22] transition-colors"
          >
            <MapPin className="h-3 w-3 text-[#F05A22]" />
            {selectedCity?.name ?? "Select city"}
            <ChevronDown className="h-3 w-3" />
          </button>
          {cityChipOpen && cityChipRect && typeof document !== "undefined" && createPortal(
            <ul
              role="listbox"
              data-portal-dropdown
              style={{
                position: "fixed",
                top: cityChipRect.top,
                left: cityChipRect.left,
                zIndex: 1000,
                maxHeight: 280,
                width: 256,
              }}
              className="bg-white rounded-xl shadow-[0_20px_60px_rgba(11,27,59,0.22)] border border-ink-7 overflow-y-auto"
            >
              {cities.map(c => {
                const active = c.id === selectedCity?.id;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => { setSelectedCity(c); setCityChipOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                        active ? "bg-primary-50 text-primary-700" : "text-ink-2 hover:bg-primary-50 hover:text-primary-700"
                      }`}
                    >
                      <MapPin className="h-3.5 w-3.5 text-ink-4 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium truncate">{c.name}</div>
                        {c.state_name && <div className="text-xs text-ink-4 truncate">{c.state_name}</div>}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>,
            document.body,
          )}
        </div>
      </div>

      {/* Trip Type Selector (driven by backend /public/cab/trip-types) */}
      <div ref={tripTypeRef} className="relative mb-4">
        <div className="flex flex-wrap gap-2">
          {tripTypes.length === 0 && (
            <div className="text-xs text-ink-4 italic">Loading trip types…</div>
          )}
          {tripTypes.map(t => {
            const Icon = TRIP_ICON_MAP[t.icon] ?? Car;
            const active = t.code === tripType;
            return (
              <button
                key={t.code} type="button"
                onClick={() => setTripType(t.code)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all
                  ${active
                    ? "bg-[#F05A22] text-white shadow-[0_2px_12px_rgba(240,90,34,0.35)]"
                    : "bg-ink-9 text-ink-3 border border-ink-7 hover:border-[#F05A22]/40 hover:text-[#F05A22]"
                  }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.display_name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search fields */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
        {/* Pickup */}
        <Field label="Pickup Location" error={errors.pickup} className="md:col-span-3">
          <LocationInput
            value={pickup} onChange={v => { setPickup(v); setErrors(e => ({...e, pickup: ""})); }}
            placeholder="City, area or landmark"
            icon={MapPin}
            cities={cities}
            useCityMode={useCityMode}
            mapsKey={mapsKey}
            selectedCity={selectedCity}
          />
        </Field>

        {/* Drop — only shown when required (OUTSTATION / ONE_WAY / AIRPORT) */}
        {requiresDrop && (
          <>
            {/* Swap icon */}
            <div className="hidden md:flex md:col-span-1 items-center justify-center pt-6">
              <button
                type="button"
                onClick={() => { const tmp = pickup; setPickup(drop); setDrop(tmp); }}
                className="h-8 w-8 rounded-full border border-ink-7 bg-white hover:bg-primary-50 hover:border-primary-300 flex items-center justify-center transition-all group"
              >
                <ArrowRight className="h-3.5 w-3.5 text-ink-4 group-hover:text-primary-600 transition-colors" />
              </button>
            </div>

            <Field label="Drop Location" error={errors.drop} className="md:col-span-3">
              <LocationInput
                value={drop} onChange={v => { setDrop(v); setErrors(e => ({...e, drop: ""})); }}
                placeholder="Destination"
                icon={Navigation}
                cities={cities}
                useCityMode={useCityMode}
                mapsKey={mapsKey}
                selectedCity={selectedCity}
              />
            </Field>
          </>
        )}

        {/* Date & Time */}
        <Field label="Pickup Date & Time" error={errors.date} className="md:col-span-3">
          <DateTimePicker
            value={dateTime}
            onChange={v => { setDateTime(v); setErrors(e => ({...e, date: ""})); }}
            label="Pickup Date & Time"
          />
        </Field>

        {/* Return Date — only for ROUND_TRIP */}
        {isRoundTrip && (
          <Field label="Return Date & Time" error={errors.returnDate} className="md:col-span-3">
            <DateTimePicker
              value={returnDateTime}
              onChange={v => { setReturnDateTime(v); setErrors(e => ({...e, returnDate: ""})); }}
              label="Return Date & Time"
              minDate={dateTime.date ?? undefined}
            />
          </Field>
        )}

        {/* Passengers */}
        <Field label="Passengers" className="md:col-span-1">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#F05A22] flex-shrink-0" />
            <select
              value={pax}
              onChange={e => setPax(+e.target.value)}
              className="w-full bg-transparent text-sm font-medium text-ink focus:outline-none"
            >
              {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} Pax</option>)}
            </select>
          </div>
        </Field>

        {/* Search Button */}
        <div className="md:col-span-1 flex items-center pt-0">
          <button
            type="button"
            onClick={handleSearch}
            className="w-full h-[60px] rounded-xl text-white font-bold text-sm inline-flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-[0_4px_20px_rgba(240,90,34,0.40)]"
            style={{ background: "linear-gradient(135deg,#F05A22,#E04A12)" }}
          >
            <Search className="h-4 w-4" />
            <span className="hidden md:block">Search</span>
          </button>
        </div>
      </div>

      {/* City mode indicator */}
      {useCityMode && mapsKey && (
        <p className="mt-2 text-xs text-ink-4">
          📍 Showing city list — enter Google Maps API key for full location search
        </p>
      )}
    </div>
  );
}
