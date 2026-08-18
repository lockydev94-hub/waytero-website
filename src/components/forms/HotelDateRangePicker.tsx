"use client";

/**
 * HotelDateRangePicker — premium check-in / check-out picker for the customer
 * website.
 *
 * Replaces the native `<input type="date">` used on the hotel detail stay bar
 * with a single-calendar range picker:
 *
 *   • One popover calendar, portaled to <body> so it escapes any
 *     `overflow-hidden` shell (same pattern as the hero search pickers).
 *   • Pick check-in first; the next tap becomes check-out. Tapping a date at
 *     or before the current check-in re-seeds check-in (with a hover preview
 *     of the in-between days).
 *   • Dates before `minDate` (today by default) are disabled; check-out can
 *     never precede check-in.
 *   • Emits plain "YYYY-MM-DD" strings so the backend contracts
 *     (`check_in` / `check_out` searchParams) are unchanged.
 *
 * Doc Ref: BRD Part 4 §57-92 (hotel booking lifecycle)
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronLeft, ChevronRight, Check } from "lucide-react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const pad = (n: number) => String(n).padStart(2, "0");

function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseISO(s: string | null | undefined): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function diffDays(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86400000);
}

function formatShort(iso: string | null): string {
  const d = parseISO(iso);
  if (!d) return "";
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}

interface HotelDateRangePickerProps {
  /** "YYYY-MM-DD" — already-selected check-in. */
  checkIn: string;
  /** "YYYY-MM-DD" — already-selected check-out. */
  checkOut: string;
  /** Earliest selectable day, "YYYY-MM-DD". Defaults to today. */
  minDate?: string;
  onChange: (range: { checkIn: string; checkOut: string }) => void;
}

export default function HotelDateRangePicker({
  checkIn,
  checkOut,
  minDate,
  onChange,
}: HotelDateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [panelRect, setPanelRect] = useState<{ top: number; left: number } | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const today = useMemo(() => startOfDay(new Date()), []);
  const min = parseISO(minDate) ?? today;
  const ci = parseISO(checkIn) ?? min;
  const co = parseISO(checkOut);
  const initial = ci ?? min;

  const [viewMonth, setViewMonth] = useState<Date>(
    () => new Date(initial.getFullYear(), initial.getMonth(), 1),
  );

  // Keep the calendar anchored to the initial check-in month when the modal
  // opens so a user landing with a URL-carried stay sees their dates at once.
  useEffect(() => {
    if (!open) return;
    setViewMonth(new Date(ci.getFullYear(), ci.getMonth(), 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Close on outside click — portaled panel lives on <body>, so a plain
  // contains() check would close it on the same mousedown that taps a day.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (target && (target as Element).closest?.("[data-hotel-daterange]")) return;
      if (ref.current && !ref.current.contains(target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on scroll/resize — the panel is anchored to viewport coords.
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
    setPanelRect({ top: r.bottom + 8, left: r.left });
  }, [open]);

  // ── Calendar grid ──────────────────────────────────────────────
  const firstWeekday = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay();
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) =>
      new Date(viewMonth.getFullYear(), viewMonth.getMonth(), i + 1)),
  ];

  const isDisabled = (d: Date) => diffDays(min, d) < 0;

  const inRange = (d: Date) => {
    if (!ci) return false;
    const lo = hoverDate ?? co;
    if (!lo) return false;
    const [a, b] = diffDays(ci, lo) < 0 ? [lo, ci] : [ci, lo];
    return diffDays(a, d) >= 0 && diffDays(b, d) <= 0;
  };

  const selectDay = (d: Date) => {
    if (isDisabled(d)) return;
    if (diffDays(d, ci) <= 0) {
      // Tap at/before the current check-in → re-seed check-in. Any existing
      // check-out that now falls at or before the new check-in is cleared.
      const newOut = co && diffDays(d, co) > 0 ? checkOut : "";
      onChange({ checkIn: toISO(d), checkOut: newOut });
    } else {
      // Second pick → check-out (guaranteed to be after check-in here).
      onChange({ checkIn, checkOut: toISO(d) });
    }
  };

  const handleDone = () => {
    // Normalise — a lone check-in implies a one-night stay (check-out +1 day),
    // and check-out is never allowed to fall at or before check-in.
    if (ci && (!co || diffDays(ci, co) <= 0)) {
      onChange({ checkIn: toISO(ci), checkOut: toISO(addDays(ci, 1)) });
    }
    setOpen(false);
  };

  const hasValidRange = !!ci && !!co && diffDays(ci, co) >= 1;

  const panel = (
    <div
      data-hotel-daterange
      style={{
        position: "fixed",
        top: panelRect?.top ?? 0,
        left: panelRect?.left ?? 0,
        zIndex: 1200,
      }}
      className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(11,27,59,0.25)] border border-ink-7 p-4 w-[320px]"
    >
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
          className="h-8 w-8 rounded-lg hover:bg-ink-9 flex items-center justify-center text-ink-3 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-bold text-ink">
          {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
        </span>
        <button
          type="button"
          onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
          className="h-8 w-8 rounded-lg hover:bg-ink-9 flex items-center justify-center text-ink-3 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-ink-4 py-1">{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} />;
          const disabled = isDisabled(d);
          const isStart = ci && d.toDateString() === ci.toDateString();
          const isEnd = co && d.toDateString() === co.toDateString();
          const isToday = d.toDateString() === today.toDateString();
          const inSel = inRange(d) && !isStart && !isEnd;
          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => selectDay(d)}
              onMouseEnter={() => setHoverDate(d)}
              onMouseLeave={() => setHoverDate(null)}
              aria-label={toISO(d)}
              className={[
                "h-8 w-full rounded-lg text-xs font-medium transition-all",
                disabled
                  ? "text-ink-6 cursor-not-allowed"
                  : "cursor-pointer",
                isStart || isEnd
                  ? "bg-[#F05A22] text-white hover:bg-[#E04A12] font-bold"
                  : inSel
                    ? "bg-primary-50 text-primary-800 font-semibold"
                    : isToday
                      ? "text-primary-700 ring-1 ring-inset ring-primary-300 font-bold"
                      : "text-ink hover:bg-ink-9",
              ].join(" ")}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>

      {/* Footer: summary + Done */}
      <div className="mt-4 pt-3 border-t border-ink-7 flex items-center justify-between gap-3">
        <div className="text-xs text-ink-4 min-w-0">
          {ci && (
            <>
              <span className="font-semibold text-ink">{formatShort(checkIn)}</span>
              {co && diffDays(ci, co) >= 1 && (
                <>
                  {" "}→{" "}
                  <span className="font-semibold text-ink">{formatShort(checkOut)}</span>
                  <span className="ml-1.5 text-[10px] font-bold text-primary-600">
                    {diffDays(ci, co)} night{diffDays(ci, co) > 1 ? "s" : ""}
                  </span>
                </>
              )}
            </>
          )}
          {!ci && "Pick check-in, then check-out"}
        </div>
        <button
          type="button"
          onClick={handleDone}
          disabled={!hasValidRange}
          className="h-9 px-4 rounded-xl bg-[#F05A22] text-white text-sm font-bold inline-flex items-center gap-1.5 hover:bg-[#E04A12] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Check className="h-3.5 w-3.5" /> Done
        </button>
      </div>
    </div>
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 text-left"
      >
        <Calendar className="h-4 w-4 text-[#F05A22] flex-shrink-0" />
        <span className="text-sm font-medium truncate text-ink">
          {checkIn ? formatShort(checkIn) : "Check-in"}
          {checkIn && checkOut && diffDays(parseISO(checkIn)!, parseISO(checkOut)!) >= 1 && (
            <span className="text-ink-4">
              {" "}→ {formatShort(checkOut)}
            </span>
          )}
        </span>
      </button>
      {open && panelRect && typeof document !== "undefined" && createPortal(panel, document.body)}
    </div>
  );
}