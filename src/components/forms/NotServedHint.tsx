"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";

/**
 * NotServedHint — the compact form of the "we don't serve this area yet"
 * message, for inside a search field.
 *
 * The old treatment dropped the full amber panel into the field itself: two
 * of them side by side (hero pickup + drop) filled the whole search card with
 * body copy and grew the panel, which is exactly what a field must not do.
 * Here the field only carries a small warning chip; the explanation lives in a
 * popover that opens on hover, focus or tap and is portaled to <body> so the
 * hero's clipped shell can't crop it.
 *
 * Doc Ref: BRD Part 3 §35 (fare engine — service-area rule)
 */
export default function NotServedHint({
  area,
  className = "",
}: {
  area?: string | null;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const CARD_W = 288;

  // Anchored under the chip, flipped above it when there isn't room below
  // (the hero fields sit near the bottom of the viewport on a laptop).
  const place = useCallback((cardH: number) => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const left = Math.min(
      Math.max(8, r.left),
      Math.max(8, window.innerWidth - CARD_W - 8),
    );
    const below = r.bottom + 8;
    const above = r.top - cardH - 8;
    const top =
      below + cardH > window.innerHeight - 8 && above >= 8 ? above : below;
    setPos({ left, top });
  }, []);

  const measure = useCallback(() => {
    place(cardRef.current?.offsetHeight ?? 168);
  }, [place]);

  // Re-place once the card has been laid out, so the flip uses its real height.
  useLayoutEffect(() => {
    if (open) measure();
  }, [open, measure]);

  const show = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (!open) place(168);
    setOpen(true);
  }, [open, place]);

  // Small grace period so the pointer can travel from chip to popover.
  const scheduleHide = useCallback(() => {
    if (pinned) return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 140);
  }, [pinned]);

  const hide = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setPinned(false);
    setOpen(false);
  }, []);

  // Esc and scroll/page movement both dismiss an unpinned popover — a fixed
  // popover would otherwise drift away from its chip.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") hide();
    };
    const onScroll = () => {
      if (!pinned) setOpen(false);
      else measure();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, pinned, hide, measure]);

  // Outside click closes a pinned (touch-opened) popover.
  useEffect(() => {
    if (!open || !pinned) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || cardRef.current?.contains(t)) return;
      hide();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, pinned, hide]);

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  return (
    <div className={`relative ${className}`}>
      <button
        ref={btnRef}
        type="button"
        aria-expanded={open}
        aria-label="Why this location can't be booked"
        onClick={() => {
          if (pinned || open) hide();
          else {
            setPinned(true);
            show();
          }
        }}
        onMouseEnter={show}
        onMouseLeave={scheduleHide}
        onFocus={show}
        onBlur={scheduleHide}
        className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-amber-50 px-2 py-[3px] text-[10.5px] font-bold leading-[1.35] text-amber-700 ring-1 ring-inset ring-amber-200/80 transition-colors hover:bg-amber-100 hover:ring-amber-300"
      >
        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
        Not served yet
      </button>

      {open && pos && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={cardRef}
            role="dialog"
            aria-label="Not served yet"
            style={{ position: "fixed", top: pos.top, left: pos.left, width: CARD_W, zIndex: 1100 }}
            onMouseEnter={show}
            onMouseLeave={scheduleHide}
            className="rounded-xl border border-ink-7 bg-white p-3.5 shadow-[0_20px_50px_rgba(11,27,59,0.18)]"
          >
            <div className="flex items-start gap-2.5">
              <span className="mt-px grid h-6 w-6 flex-shrink-0 place-items-center rounded-full bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-200/70">
                <AlertCircle className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-[12.5px] font-bold leading-snug text-ink">
                  We don&apos;t serve{" "}
                  {area ? <span className="text-amber-700">{area}</span> : "this area"} yet
                </p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-ink-3">
                  WayTero runs in and around the cities we list — pick one of them
                  and you can still book from anywhere in India.
                </p>
                <Link
                  href="/cabs"
                  className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-bold text-primary-600 hover:underline"
                >
                  See where we operate
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
