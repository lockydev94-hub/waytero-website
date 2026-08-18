"use client";

/**
 * HeroSearchForm — premium glass-effect search widget for the homepage hero.
 *
 * Has three top-level tabs (Cab / Hotel / Tour) plus dynamic sub-tabs under
 * the Cab tab that are loaded from the backend (so they reflect whatever
 * trip types the admin has actually configured pricing for).
 *
 * Cab pickup/drop fields are locked to a single character of free input —
 * once the user types one letter/word, an autocomplete dropdown appears and
 * the user MUST pick a suggestion. This is what fixes the "Reporting
 * Header: invalid JSON value received" console spam from Google Places
 * (overlapping getPlacePredictions calls caused by per-keystroke typing of
 * full place names) and ensures the fare-estimate always has lat/lng +
 * city_id to work with.
 *
 * Doc Ref: BRD Part 3 §35 (fare engine), API Doc §7 (create cab booking)
 */

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Car, Hotel, Map as MapIcon, Search, MapPin, Navigation,
  Calendar, Clock, Users, ArrowRight, Repeat2, Plane,
  Building2, BedDouble, CalendarRange, Wallet, Sparkles,
  ChevronDown,
} from "lucide-react";
import { cabService, type PublicCity, type PublicTripType } from "@/services/cabService";
import type { PublicTourSuggestion } from "@/services/tourService";

type Tab = "CAB" | "HOTEL" | "TOUR";

// ── Trip-type icon map (backend hint → Lucide icon) ──────────────────────────
const TRIP_ICON_MAP: Record<string, typeof Car> = {
  Car, Plane, Navigation, ArrowRight, Repeat2,
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

// ── Small helpers ────────────────────────────────────────────────────────────
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

// ── Two-step date + time picker (used in Cab, Hotel & Tour tabs) ────────────
//
// Opens as a centered modal dialog portaled to document.body so it escapes the
// hero's overflow-hidden shell. Unlike the old viewport-anchored popover it
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
      </button>

      {open && typeof document !== "undefined" && createPortal(modal, document.body)}
    </>
  );
}

// ── City chip — biases the autocomplete to the customer's selected city ─────
function CityChip({
  cities, selectedCity, onChange,
}: {
  cities: PublicCity[];
  selectedCity: PublicCity | null;
  onChange: (c: PublicCity) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      // Ignore clicks on the portaled dropdown — otherwise mousedown closes
      // the panel before the click can reach a city option.
      if (target && (target as Element).closest?.("[data-portal-dropdown]")) return;
      if (!ref.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on scroll/resize — the portal is anchored to viewport coords at
  // open time, so scrolling leaves the trigger and the panel misaligned.
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setDropdownRect({ top: r.bottom + 8, left: r.left });
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-white/70 mr-2 align-middle">
        Searching in
      </span>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-semibold hover:bg-white/20 transition-colors"
      >
        <MapPin className="h-3 w-3 text-[#F05A22]" />
        {selectedCity?.name ?? "Select city"}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && dropdownRect && typeof document !== "undefined" && createPortal(
        <ul
          role="listbox"
          data-portal-dropdown
          style={{
            position: "fixed",
            top: dropdownRect.top,
            left: dropdownRect.left,
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
                  onClick={() => { onChange(c); setOpen(false); }}
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
  );
}

// ── Locked Google Places input ───────────────────────────────────────────────
//
// Behavior contract:
//   • User can type ONE character / first word of free text.
//   • On first character, fetch Google Places autocomplete predictions.
//   • On any further keystroke, IGNORE the input (input is locked) and
//     re-open the dropdown so the user must pick a suggestion.
//   • Selecting a suggestion geocodes it, captures lat/lng, and asks the
//     backend for the nearest city → produces a city_id so the results
//     page actually loads fare quotes.
//   • Without a Google Maps key, fall back to the city picker (no locking).
//   • Uses a session token so overlapping requests are coalesced by Google
//     (kills the "invalid JSON value received" console spam).
//
// ─────────────────────────────────────────────────────────────────────────────

interface PlaceSuggestion {
  place_id: string;
  description: string;
}

interface LocationValue {
  label: string;
  place_id?: string;
  lat?: number;
  lng?: number;
  city_id?: number;
  city_name?: string;
}

function LockedLocationInput({
  value, onChange, placeholder, icon: Icon, cities, useCityMode, mapsKey, onResolvedCity, selectedCity,
}: {
  value: LocationValue;
  onChange: (v: LocationValue) => void;
  placeholder: string;
  icon: typeof MapPin;
  cities: PublicCity[];
  useCityMode: boolean;
  mapsKey?: string | null;
  /** Notified when a suggestion is picked so the parent can store city_id. */
  onResolvedCity?: (city: PublicCity) => void;
  /** Currently-selected city in the hero — used to bias Google Places
   *  predictions so they don't return places from other states. */
  selectedCity?: PublicCity | null;
}) {
  const [query, setQuery] = useState(value.label);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(!!value.place_id); // picked → locked
  const ref = useRef<HTMLDivElement>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const geocoder = useRef<google.maps.Geocoder | null>(null);
  const sessionToken = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  // Stash the latest request so we can detect stale responses and ignore
  // them — prevents the AutocompleteService from throwing on overlapping
  // calls (the "invalid JSON value received" console warning).
  const reqId = useRef(0);
  // Anchor rect for the floating dropdown portal — recomputed when the
  // input wrapper resizes / scrolls. The dropdown is portaled to
  // document.body so it escapes the hero form's `overflow-hidden` shell.
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
  // keep showing the typed text even though the parent's value.label has
  // been updated — the visible bug from the customer screenshot.
  useEffect(() => {
    setQuery(value.label);
    setLocked(!!value.place_id);
  }, [value.label, value.place_id]);

  // Keep the dropdown anchored to the input on resize / scroll so the
  // portal-rendered list tracks the input's position.
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
    if (!q || !autocompleteService.current) {
      setSuggestions([]);
      return;
    }
    const myId = ++reqId.current;
    setLoading(true);
    // New session token per query so each fetch is a clean transaction.
    if (!sessionToken.current) {
      sessionToken.current = new google.maps.places.AutocompleteSessionToken();
    }
    // Bias Places to the user's currently-selected city. The radius (25 km)
    // fits a tier-2 city footprint; strictBounds=true suppresses results
    // outside it so "Bhubaneswar Airport" outranks "Bihar, India" — the bug
    // reported in the customer screenshot.
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
        // Ignore stale responses — only the latest request is allowed to update UI.
        if (myId !== reqId.current) return;
        setLoading(false);
        if (status === google.maps.places.PlacesServiceStatus.OK && preds) {
          setSuggestions(preds.map(p => ({ place_id: p.place_id, description: p.description })));
          setOpen(true);
        } else {
          setSuggestions([]);
          setOpen(false);
        }
      },
    );
  }, [selectedCity]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (locked) return; // already picked — must click ✕ to change
    const q = e.target.value;
    // Hard cap: only the FIRST typed character is accepted as free input.
    // Anything beyond that would create overlapping Places requests which
    // Google rejects with the noisy console warning.
    if (q.length > 1) {
      // Keep what they typed but re-open the dropdown so they pick a place.
      setQuery(q);
      setOpen(true);
      return;
    }
    setQuery(q);
    onChange({ label: q });
    if (q.length >= 1) fetchSuggestions(q);
    else { setSuggestions([]); setOpen(false); }
  };

  const selectSuggestion = async (s: PlaceSuggestion) => {
    // Push the picked place to the parent IMMEDIATELY so the input fills
    // and the "Pick a place from the suggestions" validation clears on the
    // next render. The sync effect (below) keeps local query in sync with
    // value.label, so the input reflects this immediately.
    onChange({ label: s.description, place_id: s.place_id });
    setQuery(s.description);
    setOpen(false);
    setSuggestions([]);
    setLocked(true);

    // Enrich with lat/lng + city in the background. Geocode is slow and
    // can fail (e.g. quota, network) — but the user shouldn't have to wait
    // for it to see their pick. The onChange above has already unblocked
    // submit; this just adds the missing lat/lng/city_id for the
    // downstream fare-estimate call.
    if (geocoder.current) {
      geocoder.current.geocode({ placeId: s.place_id }, async (results, status) => {
        if (status === "OK" && results?.[0]) {
          const loc = results[0].geometry.location;
          const lat = loc.lat(), lng = loc.lng();
          try {
            const city = await cabService.matchNearestCity(lat, lng);
            onChange({
              label: s.description,
              place_id: s.place_id,
              lat, lng,
              city_id: city?.id,
              city_name: city?.name,
            });
            if (city && onResolvedCity) onResolvedCity(city);
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

  // ── City mode (no Maps key) ──────────────────────────────────────────────
  if (useCityMode) {
    const filtered = cities.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
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
        {open && filtered.length > 0 && dropdownRect && typeof document !== "undefined" &&
          createPortal(
            <div
              data-portal-dropdown
              style={{
                position: "fixed",
                top: dropdownRect.top,
                left: dropdownRect.left,
                width: Math.max(dropdownRect.width, 288),
                zIndex: 1000,
              }}
              className="bg-white rounded-xl shadow-[0_8px_32px_rgba(11,27,59,0.15)] border border-ink-7 overflow-hidden max-h-64 overflow-y-auto"
            >
              {filtered.map(c => (
                <button key={c.id} type="button"
                  onClick={() => { setQuery(c.name); setOpen(false); onChange({ label: c.name, city_id: c.id }); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink-2 hover:bg-primary-50 hover:text-primary-700 transition-colors text-left">
                  <MapPin className="h-3.5 w-3.5 text-ink-4 flex-shrink-0" />
                  <div>
                    <div className="font-medium">{c.name}</div>
                    {c.state_name && <div className="text-xs text-ink-4">{c.state_name}</div>}
                  </div>
                </button>
              ))}
            </div>,
            document.body,
          )
        }
      </div>
    );
  }

  // ── Google Maps mode (locked) ────────────────────────────────────────────
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
        {loading && <div className="h-3.5 w-3.5 border-2 border-[#F05A22]/30 border-t-[#F05A22] rounded-full animate-spin flex-shrink-0" />}
        {locked && (
          <button type="button" onClick={clearPick} aria-label="Change location"
            className="text-ink-4 hover:text-[#F05A22] flex-shrink-0 text-xs font-bold">
            ✕
          </button>
        )}
      </div>
      {locked && (
        <p className="mt-1 text-[10px] text-ink-4">Pick from the dropdown to change.</p>
      )}
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
            className="bg-white rounded-xl shadow-[0_20px_60px_rgba(11,27,59,0.22)] border border-ink-7 overflow-hidden max-h-72 overflow-y-auto"
          >
            {suggestions.map(s => (
              <button key={s.place_id} type="button"
                onClick={() => selectSuggestion(s)}
                className="w-full flex items-start gap-3 px-4 py-3 text-sm text-ink-2 hover:bg-primary-50 hover:text-primary-700 transition-colors text-left border-b border-ink-8 last:border-0">
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

// ── Cab panel ────────────────────────────────────────────────────────────────
interface CabPanelProps {
  tripTypes: PublicTripType[];
  mapsKey: string | null;
  mapsReady: boolean;
  cities: PublicCity[];
  /** Currently-selected city — biases Google Places autocomplete. */
  selectedCity: PublicCity | null;
  /** Notify parent when the user picks a different city from the chip. */
  onCityChange: (city: PublicCity) => void;
}

function CabPanel({ tripTypes, mapsKey, mapsReady, cities, selectedCity, onCityChange }: CabPanelProps) {
  const router = useRouter();
  const useCityMode = !mapsKey || !mapsReady;

  const [tripType, setTripType] = useState<string>(tripTypes[0]?.code ?? "LOCAL");
  const [pickup, setPickup] = useState<LocationValue>({ label: "" });
  const [drop, setDrop]     = useState<LocationValue>({ label: "" });
  const [pax, setPax]       = useState(1);
  const [dateTime, setDateTime] = useState({ date: null as Date | null, hour: 9, minute: 0 });
  const [returnDateTime, setReturnDateTime] = useState({ date: null as Date | null, hour: 9, minute: 0 });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // If the trip_types list arrives after first render and the default code
  // we picked is no longer present, snap to the first available.
  useEffect(() => {
    if (tripTypes.length && !tripTypes.some(t => t.code === tripType)) {
      setTripType(tripTypes[0].code);
    }
  }, [tripTypes, tripType]);

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
    if (!pickup.label.trim()) e.pickup = "Pickup is required";
    if (!dateTime.date) e.date = "Pick a date";
    // Drop location — only required for OUTSTATION / ONE_WAY / AIRPORT
    if (requiresDrop) {
      if (!drop.label.trim()) e.drop = "Drop is required";
      if (!useCityMode && !drop.place_id) e.drop = "Pick a place from the suggestions";
      if (useCityMode && !drop.city_id) e.drop = "Drop city is required";
    }
    // Return date — only for ROUND_TRIP
    if (requiresReturnDate && !returnDateTime.date) {
      e.returnDate = "Pick a return date";
    } else if (requiresReturnDate && returnDateTime.date && dateTime.date &&
               returnDateTime.date.getTime() <= dateTime.date.getTime()) {
      e.returnDate = "Return date must be after pickup date";
    }
    // Pickup place/city validation
    if (!useCityMode && !pickup.place_id) e.pickup = "Pick a place from the suggestions";
    if (useCityMode && !pickup.city_id) e.pickup = "Pickup city is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSearch = async () => {
    if (!validate()) return;
    const dt = dateTime.date!;
    const dateStr = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;
    const timeStr = `${String(dateTime.hour).padStart(2,"0")}:${String(dateTime.minute).padStart(2,"0")}`;

    const params = new URLSearchParams({
      trip_type: tripType, pickup: pickup.label, date: dateStr, time: timeStr, pax: String(pax),
    });
    if (drop.label) params.set("drop", drop.label);
    if (pickup.lat) params.set("plat", String(pickup.lat));
    if (pickup.lng) params.set("plng", String(pickup.lng));
    if (drop.lat)   params.set("dlat", String(drop.lat));
    if (drop.lng)   params.set("dlng", String(drop.lng));
    // Return date — encoded so the results page can use it.
    if (isRoundTrip && returnDateTime.date) {
      const rd = returnDateTime.date;
      params.set("return_date",
        `${rd.getFullYear()}-${String(rd.getMonth()+1).padStart(2,"0")}-${String(rd.getDate()).padStart(2,"0")}`);
      params.set("return_time",
        `${String(returnDateTime.hour).padStart(2,"0")}:${String(returnDateTime.minute).padStart(2,"0")}`);
    }

    // Resolve city_id — pickup's own city (from Places selection) wins,
    // else the chip's selectedCity, else backend nearest-city match on
    // pickup coords. Without one of these the fare-estimate call 400s.
    let cityId = pickup.city_id ?? selectedCity?.id;
    if (!cityId && pickup.lat && pickup.lng) {
      try {
        const c = await cabService.matchNearestCity(pickup.lat, pickup.lng);
        cityId = c?.id;
      } catch {
        cityId = undefined;
      }
    }
    if (cityId) params.set("city_id", String(cityId));

    // Auto-compute road distance when both ends have coordinates (1.25×
    // haversine approximates road distance for tier-2 cities). Round
    // trip distance = 2× one-way. When only pickup is provided (LOCAL /
    // ROUND_TRIP without drop), use a trip-type default so the results
    // page doesn't hang waiting on `distanceKm` to resolve.
    if (pickup.lat && pickup.lng && drop.lat && drop.lng) {
      const km = Math.round(haversineKm(pickup.lat, pickup.lng, drop.lat, drop.lng) * 1.25 * 10) / 10;
      const total = isRoundTrip ? km * 2 : km;
      params.set("distance_km", String(total));
    } else {
      // Trip-type defaults that produce sensible quotes on /cabs/results.
      // LOCAL: typical in-city ride 10 km. ROUND_TRIP without a drop:
      // assume a 25 km half-loop, doubled. OUTSTATION / ONE_WAY / AIRPORT
      // without coords is rare but default to 30 km.
      let defaultKm = 30;
      if (tripType === "LOCAL") {
        defaultKm = 10;
      } else if (isRoundTrip) {
        defaultKm = 50; // 25 km half-loop × 2
      }
      params.set("distance_km", String(defaultKm));
    }

    router.push(`/cabs/results?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* "Searching in <city> ▾" chip — biases Google Places autocomplete
          so suggestions come from the customer's selected city, not from
          anywhere in the country. */}
      <CityChip
        cities={cities}
        selectedCity={selectedCity}
        onChange={onCityChange}
      />

      {/* Trip type sub-tabs (from backend) */}
      <div className="flex flex-wrap gap-2">
        {tripTypes.length === 0 && (
          <div className="text-xs text-white/70 italic">Loading trip types…</div>
        )}
        {tripTypes.map(t => {
          const Icon = TRIP_ICON_MAP[t.icon] ?? Car;
          const active = t.code === tripType;
          return (
            <button key={t.code} type="button" onClick={() => setTripType(t.code)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all border
                ${active
                  ? "bg-gradient-to-r from-[#F05A22] to-[#E04A12] text-white border-transparent shadow-[0_4px_16px_rgba(240,90,34,0.45)]"
                  : "bg-white/8 text-white/85 border-white/15 hover:bg-white/15 hover:border-white/30"
                }`}>
              <Icon className="h-3.5 w-3.5" />
              {t.display_name}
            </button>
          );
        })}
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-stretch">
        <GlassField label="From" error={errors.pickup} className="md:col-span-3">
          <LockedLocationInput
            value={pickup} onChange={v => { setPickup(v); setErrors(e => ({...e, pickup: ""})); }}
            placeholder="Type 1 letter to start…" icon={MapPin}
            cities={cities} useCityMode={useCityMode} mapsKey={mapsKey}
            selectedCity={selectedCity}
          />
        </GlassField>

        {requiresDrop && (
          <>
            <div className="hidden md:flex md:col-span-1 items-center justify-center">
              <button type="button" aria-label="Swap pickup and drop"
                onClick={() => { const t = pickup; setPickup(drop); setDrop(t); }}
                className="h-9 w-9 rounded-full border border-white/25 bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all text-white">
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <GlassField label="To" error={errors.drop} className="md:col-span-3">
              <LockedLocationInput
                value={drop} onChange={v => { setDrop(v); setErrors(e => ({...e, drop: ""})); }}
                placeholder="Type 1 letter to start…" icon={Navigation}
                cities={cities} useCityMode={useCityMode} mapsKey={mapsKey}
                selectedCity={selectedCity}
              />
            </GlassField>
          </>
        )}

        <GlassField label="Pickup Date & Time" error={errors.date} className="md:col-span-2">
          <DateTimePicker value={dateTime} onChange={v => { setDateTime(v); setErrors(e => ({...e, date: ""})); }} label="Select date" />
        </GlassField>

        {isRoundTrip && (
          <GlassField label="Return Date & Time" error={errors.returnDate} className="md:col-span-2">
            <DateTimePicker
              value={returnDateTime}
              onChange={v => { setReturnDateTime(v); setErrors(e => ({...e, returnDate: ""})); }}
              label="Return date"
              minDate={dateTime.date ?? undefined}
            />
          </GlassField>
        )}

        <GlassField label="Passengers" className="md:col-span-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#F05A22] flex-shrink-0" />
            <select value={pax} onChange={e => setPax(+e.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-ink focus:outline-none">
              {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} Pax</option>)}
            </select>
          </div>
        </GlassField>

        <div className="md:col-span-1 flex">
          <button type="button" onClick={handleSearch}
            className="w-full h-full min-h-[56px] rounded-2xl text-white font-extrabold text-sm inline-flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-[0_8px_30px_rgba(240,90,34,0.55)]"
            style={{ background: "linear-gradient(135deg,#F05A22 0%,#E04A12 60%,#C03A02 100%)" }}>
            <Search className="h-4 w-4" />
            <span className="hidden lg:inline">Go</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function GlassField({ label, error, className = "", children }: {
  label: string; error?: string; className?: string; children: React.ReactNode;
}) {
  return (
    <div className={`${className} flex flex-col`}>
      <div className={`relative px-4 py-2.5 rounded-2xl border transition-all backdrop-blur-md
        ${error
          ? "border-red-400/60 bg-red-500/15"
          : "border-white/15 bg-white/95 hover:border-white/40 focus-within:border-white/60 focus-within:shadow-[0_8px_24px_rgba(240,90,34,0.25)]"
        }`}>
        <div className="text-[10px] font-extrabold text-ink-4 uppercase tracking-[0.12em] mb-0.5">{label}</div>
        {children}
      </div>
      {error && <p className="text-xs text-red-200 mt-1 px-1 font-medium drop-shadow">{error}</p>}
    </div>
  );
}

// ── Hotel panel ──────────────────────────────────────────────────────────────
// City / place based hotel search — mirrors the cab panel: pick a hotel city
// (or type a place), choose dates + guests + rooms, then land on
// /hotels/results which lists the properties and their starting nightly prices.
function HotelPanel() {
  const router = useRouter();
  const [cities, setCities] = useState<Array<{ id: number; name: string; state_name?: string }>>([]);
  const [cityQuery, setCityQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<{ id: number; name: string } | null>(null);
  const [checkIn, setCI]  = useState<Date | null>(null);
  const [checkOut, setCO] = useState<Date | null>(null);
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms]   = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // City autocomplete dropdown is portaled to document.body because the hero
  // shell clips with overflow-hidden (same reason the cab inputs portal).
  const cityFieldRef = useRef<HTMLDivElement>(null);
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const [cityOpen, setCityOpen] = useState(false);

  useEffect(() => {
    import("@/services/hotelService").then(({ hotelService }) =>
      hotelService.getCities().then(setCities).catch(() => {}),
    );
  }, []);

  // Close the city dropdown on outside clicks and scroll/resize (the portal
  // is anchored to viewport coords at open time).
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (target && (target as Element).closest?.("[data-hotel-city-dd]")) return;
      if (cityFieldRef.current && !cityFieldRef.current.contains(target)) setCityOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!cityOpen || !cityFieldRef.current) return;
    const update = () => {
      const r = cityFieldRef.current?.getBoundingClientRect();
      if (r) setDropdownRect({ top: r.bottom + 8, left: r.left, width: r.width });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [cityOpen]);

  const filtered = cities.filter(c =>
    c.name.toLowerCase().includes(cityQuery.toLowerCase()),
  );

  const validate = () => {
    const e: Record<string, string> = {};
    if (!selectedCity && !cityQuery.trim()) e.city = "Pick a city or type a place";
    if (!checkIn) e.checkIn = "Pick a check-in date";
    if (!checkOut) e.checkOut = "Pick a check-out date";
    if (checkIn && checkOut && checkOut <= checkIn) e.checkOut = "Check-out must be after check-in";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const params = new URLSearchParams();
    if (selectedCity) params.set("city_id", String(selectedCity.id));
    else if (cityQuery.trim()) params.set("q", cityQuery.trim());
    if (checkIn) params.set("check_in", checkIn.toISOString().slice(0, 10));
    if (checkOut) params.set("check_out", checkOut.toISOString().slice(0, 10));
    params.set("guests", String(guests));
    params.set("rooms", String(rooms));
    router.push(`/hotels/results?${params.toString()}`);
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-stretch">
      <GlassField label="City / Place" error={errors.city} className="md:col-span-4">
        <div ref={cityFieldRef} className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-[#F05A22] flex-shrink-0" />
          {selectedCity ? (
            <>
              <span className="text-sm font-semibold text-ink truncate">{selectedCity.name}</span>
              <button
                type="button"
                aria-label="Change city"
                onClick={() => { setSelectedCity(null); setCityQuery(""); setCityOpen(true); }}
                className="text-ink-4 hover:text-[#F05A22] flex-shrink-0 text-xs font-bold"
              >
                ✕
              </button>
            </>
          ) : (
            <input
              value={cityQuery}
              onChange={e => { setCityQuery(e.target.value); setCityOpen(true); setErrors(prev => ({ ...prev, city: "" })); }}
              onFocus={() => setCityOpen(true)}
              placeholder="Goa, Manali, Jaipur…"
              className="w-full bg-transparent text-sm font-semibold text-ink placeholder:text-ink-4 focus:outline-none"
            />
          )}
        </div>
        {!selectedCity && cityOpen && filtered.length > 0 && dropdownRect && typeof document !== "undefined" &&
          createPortal(
            <div
              data-hotel-city-dd
              style={{
                position: "fixed",
                top: dropdownRect.top,
                left: dropdownRect.left,
                width: Math.max(dropdownRect.width, 288),
                zIndex: 1200,
              }}
              className="bg-white rounded-xl border border-ink-7 shadow-[0_12px_40px_rgba(11,27,59,0.18)] overflow-hidden max-h-56 overflow-y-auto"
            >
              {filtered.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { setSelectedCity({ id: c.id, name: c.name }); setCityQuery(""); setCityOpen(false); setErrors(prev => ({ ...prev, city: "" })); }}
                  className="w-full flex items-center gap-2 px-3.5 py-2.5 text-left text-sm hover:bg-primary-50 hover:text-primary-700 transition-colors"
                >
                  <MapPin className="h-3.5 w-3.5 text-ink-4 flex-shrink-0" />
                  <span className="font-medium text-ink">{c.name}</span>
                  {c.state_name && <span className="text-xs text-ink-4 ml-auto">{c.state_name}</span>}
                </button>
              ))}
            </div>,
            document.body,
          )
        }
      </GlassField>
      <GlassField label="Check-in" error={errors.checkIn} className="md:col-span-3">
        <DateTimePicker
          value={{ date: checkIn, hour: 12, minute: 0 }}
          onChange={v => { setCI(v.date); setErrors(prev => ({ ...prev, checkIn: "" })); }}
          label="Check-in date" />
      </GlassField>
      <GlassField label="Check-out" error={errors.checkOut} className="md:col-span-3">
        <DateTimePicker
          value={{ date: checkOut, hour: 11, minute: 0 }}
          onChange={v => { setCO(v.date); setErrors(prev => ({ ...prev, checkOut: "" })); }}
          label="Check-out date" minDate={checkIn ?? undefined} />
      </GlassField>
      <GlassField label="Guests · Rooms" className="md:col-span-1">
        <div className="flex items-center gap-2">
          <BedDouble className="h-4 w-4 text-[#F05A22] flex-shrink-0" />
          <select
            value={`${guests}·${rooms}`}
            onChange={e => {
              const [g, r] = e.target.value.split("·").map(Number);
              setGuests(g); setRooms(r);
            }}
            className="w-full bg-transparent text-sm font-semibold text-ink focus:outline-none"
          >
            {[[2,1],[2,2],[3,1],[4,1],[4,2],[6,2]].map(([g, r]) => (
              <option key={`${g}·${r}`} value={`${g}·${r}`}>{g}·{r}</option>
            ))}
          </select>
        </div>
      </GlassField>
      <div className="md:col-span-1 flex">
        <button type="submit"
          className="w-full h-full min-h-[56px] rounded-2xl text-white font-extrabold text-sm inline-flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-[0_8px_30px_rgba(240,90,34,0.55)]"
          style={{ background: "linear-gradient(135deg,#F05A22 0%,#E04A12 60%,#C03A02 100%)" }}>
          <Search className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}

// ── Tour panel ───────────────────────────────────────────────────────────────
//
// Behavior contract:
//   • As the user types, a debounced call to /public/tours/suggestions
//     matches ACTIVE packages by name, destination, package code or city
//     ("puri", "bhubaneswar", "odisha"…).
//   • Picking a package from the dropdown locks it in — pressing Go (or
//     Enter) then deep-links straight to the package detail page
//     (/tours/{slug}) instead of the generic listing.
//   • If nothing is picked, Go / Enter keeps the old behaviour: it searches
//     the listing page (/tours?destination=…&date=…&pax=…).
//
function TourPanel() {
  const router = useRouter();
  const [destination, setDest] = useState("");
  const [date, setDate]       = useState<Date | null>(null);
  const [pax, setPax]         = useState(2);

  // Autocomplete state — dropdown is portaled to document.body because the
  // hero shell clips with overflow-hidden (same reason as the hotel panel).
  const [suggestions, setSuggestions] = useState<PublicTourSuggestion[]>([]);
  const [loading, setLoading]         = useState(false);
  const [open, setOpen]               = useState(false);
  const [selected, setSelected]       = useState<PublicTourSuggestion | null>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const reqId     = useRef(0);
  const debounce  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (target && (target as Element).closest?.("[data-tour-dd]")) return;
      if (fieldRef.current && !fieldRef.current.contains(target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!open || !fieldRef.current) return;
    const update = () => {
      const r = fieldRef.current?.getBoundingClientRect();
      if (r) setDropdownRect({ top: r.bottom + 8, left: r.left, width: r.width });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  useEffect(() => () => { if (debounce.current) clearTimeout(debounce.current); }, []);

  const fetchSuggestions = useCallback((q: string) => {
    if (!q.trim()) { setSuggestions([]); setOpen(false); return; }
    const myId = ++reqId.current;
    setLoading(true);
    import("@/services/tourService").then(({ tourService }) =>
      tourService.suggest(q).then(items => {
        if (myId !== reqId.current) return; // stale response — ignore
        setSuggestions(items);
        setLoading(false);
        setOpen(true);
      }).catch(() => {
        if (myId !== reqId.current) return;
        setSuggestions([]); setLoading(false); setOpen(false);
      }),
    );
  }, []);

  const handleChange = (v: string) => {
    setDest(v);
    setSelected(null); // typing invalidates a previously picked package
    if (debounce.current) clearTimeout(debounce.current);
    if (!v.trim()) { setSuggestions([]); setOpen(false); return; }
    debounce.current = setTimeout(() => fetchSuggestions(v), 250);
  };

  const pickSuggestion = (s: PublicTourSuggestion) => {
    setSelected(s);
    setDest(s.package_name);
    setSuggestions([]);
    setOpen(false);
    if (debounce.current) clearTimeout(debounce.current);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    // A picked package wins: deep-link to its detail page, carrying the
    // hero's date + traveller count so the booking sidebar opens pre-filled.
    if (selected) {
      if (date) params.set("date", date.toISOString().slice(0, 10));
      if (pax && pax !== 2) params.set("persons", String(pax));
      const qs = params.toString();
      router.push(`/tours/${selected.slug}${qs ? `?${qs}` : ""}`);
      return;
    }
    if (destination) params.set("destination", destination);
    if (date) params.set("date", date.toISOString().slice(0, 10));
    // The listing page reads `persons` (see readFiltersFromParams) — the
    // old `pax` key was silently ignored.
    params.set("persons", String(pax));
    router.push(`/tours?${params.toString()}`);
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-stretch">
      <GlassField label="Destination / Tour package" className="md:col-span-5">
        <div ref={fieldRef} className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#F05A22] flex-shrink-0" />
          <input
            value={destination}
            onChange={e => handleChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            placeholder="Search a place or package — Puri, Odisha…"
            className="w-full bg-transparent text-sm font-semibold text-ink placeholder:text-ink-4 focus:outline-none"
          />
          {loading && <div className="h-3.5 w-3.5 border-2 border-[#F05A22]/30 border-t-[#F05A22] rounded-full animate-spin flex-shrink-0" />}
          {selected && (
            <button type="button" aria-label="Change package" onClick={() => { setSelected(null); }}
              className="text-ink-4 hover:text-[#F05A22] flex-shrink-0 text-xs font-bold">✕</button>
          )}
        </div>
        {selected && (
          <p className="mt-1 text-[10px] text-ink-4">Go opens this package's details. ✕ to search all tours instead.</p>
        )}
        {open && suggestions.length > 0 && dropdownRect && typeof document !== "undefined" &&
          createPortal(
            <div
              data-tour-dd
              style={{
                position: "fixed",
                top: dropdownRect.top,
                left: dropdownRect.left,
                width: Math.max(dropdownRect.width, 360),
                zIndex: 1200,
              }}
              className="bg-white rounded-xl border border-ink-7 shadow-[0_12px_40px_rgba(11,27,59,0.18)] overflow-hidden max-h-80 overflow-y-auto"
            >
              {suggestions.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => pickSuggestion(s)}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-primary-50 transition-colors border-b border-ink-8 last:border-0"
                >
                  {s.primary_image_url ? (
                    <img src={s.primary_image_url} alt="" className="h-10 w-10 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <span className="h-10 w-10 rounded-lg bg-primary-50 text-[#F05A22] flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-4 w-4" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-ink truncate">{s.package_name}</span>
                    <span className="block text-xs text-ink-4 truncate">
                      {s.destination}{s.city_name ? ` · ${s.city_name}` : ""} · {s.duration_days}D/{s.duration_nights}N
                    </span>
                  </span>
                  {s.starting_price > 0 && (
                    <span className="text-sm font-bold text-[#F05A22] flex-shrink-0">
                      ₹{s.starting_price.toLocaleString("en-IN")}
                    </span>
                  )}
                </button>
              ))}
            </div>,
            document.body,
          )
        }
      </GlassField>
      <GlassField label="Start Date" className="md:col-span-3">
        <DateTimePicker
          value={{ date, hour: 9, minute: 0 }}
          onChange={v => setDate(v.date)}
          label="Start date" />
      </GlassField>
      <GlassField label="Travellers" className="md:col-span-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-[#F05A22] flex-shrink-0" />
          <select value={pax} onChange={e => setPax(+e.target.value)}
            className="w-full bg-transparent text-sm font-semibold text-ink focus:outline-none">
            {[1,2,3,4,5,6,7,8,10,12].map(n => <option key={n} value={n}>{n} Travellers</option>)}
          </select>
        </div>
      </GlassField>
      <div className="md:col-span-1 flex">
        <button type="submit"
          className="w-full h-full min-h-[56px] rounded-2xl text-white font-extrabold text-sm inline-flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-[0_8px_30px_rgba(240,90,34,0.55)]"
          style={{ background: "linear-gradient(135deg,#F05A22 0%,#E04A12 60%,#C03A02 100%)" }}>
          <Search className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}

// ── Main hero form ───────────────────────────────────────────────────────────
interface HeroSearchFormProps {
  /** Which tab is active on first render. Defaults to CAB (homepage). */
  defaultService?: Tab;
}

export default function HeroSearchForm({ defaultService = "CAB" }: HeroSearchFormProps) {
  const [tab, setTab] = useState<Tab>(defaultService);

  // Trip types — fetched from the backend (NOT hardcoded).
  const [tripTypes, setTripTypes] = useState<PublicTripType[]>([]);

  // Google Maps key (admin-configured via /public/cab/google-maps-key).
  const [mapsKey, setMapsKey]     = useState<string | null>(process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? null);
  const [mapsReady, setMapsReady] = useState(false);

  // Active cities for city-fallback + nearest-city lookup.
  const [cities, setCities]       = useState<PublicCity[]>([]);
  // Default the hero to Bhubaneswar if the cities list includes it — the
  // hero is "Across Odisha" — otherwise fall back to the first city with
  // lat/lng populated, then the first city in the list.
  const [selectedCity, setSelectedCity] = useState<PublicCity | null>(null);

  useEffect(() => {
    cabService.getTripTypes()
      .then(setTripTypes)
      .catch(() => setTripTypes([]));
  }, []);

  useEffect(() => {
    if (mapsKey) return;
    cabService.getGoogleMapsKey().then(r => { if (r?.api_key) setMapsKey(r.api_key); }).catch(() => {});
  }, [mapsKey]);

  useEffect(() => {
    if (!mapsKey) return;
    if ((window as any).google?.maps?.places) { setMapsReady(true); return; }
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${mapsKey}&libraries=places`;
    s.async = true;
    s.onload  = () => setMapsReady(true);
    s.onerror = () => setMapsReady(false);
    document.head.appendChild(s);
    return () => { try { document.head.removeChild(s); } catch {} };
  }, [mapsKey]);

  useEffect(() => {
    cabService.getCities().then(setCities).catch(() => {});
  }, []);

  // When the cities list arrives, pick a sensible default for the chip.
  // Preference order: Bhubaneswar (the page is "Across Odisha"), then the
  // first city with coords, then the first city.
  useEffect(() => {
    if (selectedCity || cities.length === 0) return;
    const bbs = cities.find(c => c.city_code === "BBS");
    const withCoords = cities.find(c => c.latitude != null && c.longitude != null);
    setSelectedCity(bbs ?? withCoords ?? cities[0] ?? null);
  }, [cities, selectedCity]);

  const tabs = useMemo(() => ([
    { id: "CAB"   as const, label: "Cabs",   icon: Car },
    { id: "HOTEL" as const, label: "Hotels", icon: Hotel },
    { id: "TOUR"  as const, label: "Tours",  icon: MapIcon },
  ]), []);

  return (
    <div className="relative">
      {/* Outer glow */}
      <div aria-hidden className="absolute -inset-3 rounded-[32px] bg-gradient-to-r from-[#F05A22]/20 via-white/10 to-[#F05A22]/20 blur-2xl pointer-events-none" />
      <div className="relative rounded-[28px] overflow-hidden border border-white/15 shadow-[0_30px_80px_rgba(11,27,59,0.45)] backdrop-blur-xl bg-white/8">
        {/* Inner gradient surface */}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-white/12 via-white/5 to-white/8 pointer-events-none" />
        <div aria-hidden className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-[#F05A22]/25 blur-3xl pointer-events-none" />
        <div aria-hidden className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-primary-400/20 blur-3xl pointer-events-none" />

        <div className="relative p-5 sm:p-6 lg:p-7">
          {/* Tabs */}
          <div role="tablist" aria-label="Search service"
            className="flex items-center gap-1 p-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-md w-fit mb-5">
            {tabs.map(t => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button key={t.id} role="tab" aria-selected={active}
                  onClick={() => setTab(t.id)}
                  className={`inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-full text-sm font-bold transition-all
                    ${active
                      ? "bg-gradient-to-r from-[#F05A22] to-[#E04A12] text-white shadow-[0_6px_20px_rgba(240,90,34,0.45)]"
                      : "text-white/85 hover:text-white hover:bg-white/10"
                    }`}>
                  <Icon className="h-4 w-4" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Body */}
          {tab === "CAB"   && <CabPanel tripTypes={tripTypes} mapsKey={mapsKey} mapsReady={mapsReady} cities={cities} selectedCity={selectedCity} onCityChange={setSelectedCity} />}
          {tab === "HOTEL" && <HotelPanel />}
          {tab === "TOUR"  && <TourPanel />}
        </div>
      </div>
    </div>
  );
}
