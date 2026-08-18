"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Car, Hotel, Map, Calendar, Users, MapPin, Search } from "lucide-react";
import { Container } from "@/components/ui";
import type { ServiceType } from "@/types/cms";

type Tab = ServiceType | "CAB" | "HOTEL" | "TOUR";

interface ServiceSearchFormProps {
  defaultService?: ServiceType | "CAB" | "HOTEL" | "TOUR";
  variant?: "card" | "embedded";
}

/**
 * ServiceSearchForm — shared between homepage hero and service landing pages.
 * Provides a single segmented-tabbed form with the three service inputs.
 */
export default function ServiceSearchForm({ defaultService = "CAB", variant = "card" }: ServiceSearchFormProps) {
  const router = useRouter();
  const initial = (["CAB", "HOTEL", "TOUR"].includes(defaultService) ? defaultService : "CAB") as Tab;
  const [tab, setTab] = useState<Tab>(initial);
  const [tourDestination, setTourDestination] = useState("");
  const [tourDate, setTourDate] = useState("");
  const [tourDuration, setTourDuration] = useState("");
  const [tourPax, setTourPax] = useState("2");

  const tabs: Array<{ id: Tab; label: string; icon: typeof Car }> = [
    { id: "CAB", label: "Cabs", icon: Car },
    { id: "HOTEL", label: "Hotels", icon: Hotel },
    { id: "TOUR", label: "Tours", icon: Map },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === "CAB") router.push("/cabs");
    else if (tab === "HOTEL") router.push("/hotels");
    else {
      const params = new URLSearchParams();
      if (tourDestination.trim()) params.set("destination", tourDestination.trim());
      if (tourDate) params.set("date", tourDate);
      if (tourDuration) params.set("duration", tourDuration);
      params.set("pax", tourPax);
      router.push(`/tours?${params.toString()}`);
    }
  };

  const isCard = variant === "card";
  const wrapperCls = isCard
    ? "rounded-3xl bg-white border border-ink-7 shadow-wt-lg overflow-hidden"
    : "";

  return (
    <div className={wrapperCls}>
      <div role="tablist" className="flex border-b border-ink-7 bg-ink-9/60 px-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 sm:flex-none px-5 py-4 text-sm font-semibold inline-flex items-center justify-center gap-2 border-b-2 transition-colors ${
                tab === t.id ? "text-primary-600 border-primary-600 bg-white" : "text-ink-3 border-transparent hover:text-ink-2"
              }`}
            >
              <Icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="p-5 lg:p-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {tab === "CAB" && (
            <>
              <FieldShell className="md:col-span-4" label="Pickup">
                <input
                  type="text"
                  placeholder="Enter pickup location"
                  className="w-full h-11 bg-transparent text-sm focus:outline-none placeholder:text-ink-5"
                />
              </FieldShell>
              <FieldShell className="md:col-span-4" label="Drop">
                <input
                  type="text"
                  placeholder="Enter destination"
                  className="w-full h-11 bg-transparent text-sm focus:outline-none placeholder:text-ink-5"
                />
              </FieldShell>
              <FieldShell className="md:col-span-2" label="Pickup at">
                <input type="datetime-local" className="w-full h-11 bg-transparent text-sm focus:outline-none" />
              </FieldShell>
              <button
                type="submit"
                className="md:col-span-2 h-11 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold inline-flex items-center justify-center gap-2 shadow-wt-primary"
              >
                <Search className="h-4 w-4" /> Search
              </button>
            </>
          )}
          {tab === "HOTEL" && <HotelFields />}
          {tab === "TOUR" && (
            <>
              <FieldShell className="md:col-span-5" label="Destination">
                <input
                  type="text"
                  placeholder="e.g. Goa, Kerala, Rajasthan"
                  value={tourDestination}
                  onChange={e => setTourDestination(e.target.value)}
                  className="w-full h-11 bg-transparent text-sm focus:outline-none placeholder:text-ink-5"
                />
              </FieldShell>
              <FieldShell className="md:col-span-2" label="Travel date">
                <input type="date" value={tourDate} onChange={e => setTourDate(e.target.value)} className="w-full h-11 bg-transparent text-sm focus:outline-none" />
              </FieldShell>
              <FieldShell className="md:col-span-2" label="Duration">
                <select value={tourDuration} onChange={e => setTourDuration(e.target.value)} className="w-full h-11 bg-transparent text-sm focus:outline-none">
                  <option value="">Any</option>
                  <option value="1-3">1-3 Days</option>
                  <option value="4-7">4-7 Days</option>
                  <option value="8-14">8-14 Days</option>
                  <option value="15-90">15+ Days</option>
                </select>
              </FieldShell>
              <FieldShell className="md:col-span-2" label="Travellers">
                <select value={tourPax} onChange={e => setTourPax(e.target.value)} className="w-full h-11 bg-transparent text-sm focus:outline-none">
                  {[1, 2, 3, 4, 5, 6, 8, 10, 12].map(n => <option key={n} value={n}>{n} travellers</option>)}
                </select>
              </FieldShell>
              <button
                type="submit"
                className="md:col-span-1 h-11 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold inline-flex items-center justify-center gap-2 shadow-wt-primary"
              >
                <Search className="h-4 w-4" /> Search Tours
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}

function FieldShell({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block rounded-xl bg-ink-9 px-4 pt-1.5 border border-transparent focus-within:border-primary-600 focus-within:bg-white transition-colors ${className}`}>
      <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-4 mt-1">{label}</span>
      {children}
    </label>
  );
}

/**
 * HotelFields — the HOTEL tab of ServiceSearchForm. City/place based search:
 * pick a hotel city (autocomplete) or type a place, choose dates + guests,
 * then land on /hotels/results which lists the properties with starting
 * nightly prices. Doc Ref: public_hotel_api.py
 */
function HotelFields() {
  const router = useRouter();
  const [cities, setCities] = useState<Array<{ id: number; name: string; state_name?: string }>>([]);
  const [cityQuery, setCityQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<{ id: number; name: string } | null>(null);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [error, setError] = useState<string | null>(null);
  // City autocomplete is portaled to document.body — the outer card clips
  // with overflow-hidden, so an in-flow dropdown would be cut off.
  const cityFieldRef = useRef<HTMLDivElement>(null);
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const [cityOpen, setCityOpen] = useState(false);

  useEffect(() => {
    import("@/services/hotelService").then(({ hotelService }) =>
      hotelService.getCities().then(setCities).catch(() => {}),
    );
  }, []);

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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCity && !cityQuery.trim()) {
      setError("Pick a city or type a place");
      return;
    }
    if (checkIn && checkOut && new Date(checkOut) <= new Date(checkIn)) {
      setError("Check-out must be after check-in");
      return;
    }
    setError(null);
    const params = new URLSearchParams();
    if (selectedCity) params.set("city_id", String(selectedCity.id));
    else if (cityQuery.trim()) params.set("q", cityQuery.trim());
    if (checkIn) params.set("check_in", checkIn);
    if (checkOut) params.set("check_out", checkOut);
    params.set("guests", String(guests));
    params.set("rooms", String(rooms));
    router.push(`/hotels/results?${params.toString()}`);
  };

  return (
    <div className="relative">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <FieldShell className="md:col-span-5" label="City / Place">
          <div ref={cityFieldRef}>
            {selectedCity ? (
              <span className="inline-flex items-center gap-2 h-11 text-sm font-semibold text-ink">
                <MapPin className="h-4 w-4 text-primary-600" />
                {selectedCity.name}
                <button
                  type="button"
                  aria-label="Change city"
                  onClick={() => { setSelectedCity(null); setCityQuery(""); setCityOpen(true); }}
                  className="text-ink-4 hover:text-primary-600 text-xs font-bold"
                >
                  ✕
                </button>
              </span>
            ) : (
              <input
                type="text"
                value={cityQuery}
                onChange={e => { setCityQuery(e.target.value); setCityOpen(true); setError(null); }}
                onFocus={() => setCityOpen(true)}
                placeholder="Goa, Manali, Marine Drive…"
                className="w-full h-11 bg-transparent text-sm focus:outline-none placeholder:text-ink-5"
              />
            )}
          </div>
        </FieldShell>
        <FieldShell className="md:col-span-2" label="Check-in">
          <input
            type="date"
            value={checkIn}
            min={new Date().toISOString().slice(0, 10)}
            onChange={e => setCheckIn(e.target.value)}
            className="w-full h-11 bg-transparent text-sm focus:outline-none"
          />
        </FieldShell>
        <FieldShell className="md:col-span-2" label="Check-out">
          <input
            type="date"
            value={checkOut}
            min={checkIn || undefined}
            onChange={e => setCheckOut(e.target.value)}
            className="w-full h-11 bg-transparent text-sm focus:outline-none"
          />
        </FieldShell>
        <FieldShell className="md:col-span-2" label="Guests · Rooms">
          <select
            value={`${guests}·${rooms}`}
            onChange={e => {
              const [g, r] = e.target.value.split("·").map(Number);
              setGuests(g); setRooms(r);
            }}
            className="w-full h-11 bg-transparent text-sm focus:outline-none"
          >
            {[[2, 1], [2, 2], [3, 1], [4, 1], [4, 2], [6, 2]].map(([g, r]) => (
              <option key={`${g}·${r}`} value={`${g}·${r}`}>{g} guests · {r} room{r > 1 ? "s" : ""}</option>
            ))}
          </select>
        </FieldShell>
        <button
          type="submit"
          onClick={submit}
          className="md:col-span-1 h-11 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold inline-flex items-center justify-center gap-2 shadow-wt-primary"
        >
          <Search className="h-4 w-4" /> Search
        </button>
      </div>
      {!selectedCity && cityOpen && filtered.length > 0 && dropdownRect && typeof document !== "undefined" &&
        createPortal(
          <div
            data-hotel-city-dd
            style={{
              position: "fixed",
              top: dropdownRect.top,
              left: dropdownRect.left,
              width: Math.max(dropdownRect.width, 320),
              zIndex: 1200,
            }}
            className="bg-white rounded-xl border border-ink-7 shadow-wt-lg overflow-hidden max-h-60 overflow-y-auto"
          >
            {filtered.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => { setSelectedCity({ id: c.id, name: c.name }); setCityQuery(""); setCityOpen(false); setError(null); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-primary-50 hover:text-primary-700 transition-colors"
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
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
