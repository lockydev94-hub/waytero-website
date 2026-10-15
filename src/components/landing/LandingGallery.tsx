"use client";

// ============================================================
// LandingGallery — real photos of this place, with an accessible
// lightbox (focus trap, Esc to close, ←/→ to move, scroll lock,
// aria-modal). Tiles are decorative-first so a page with no
// uploads renders nothing rather than empty frames.
//
// Responsive: <640 grid-cols-2 (first tile spans 2, 16/9) ·
// sm grid-cols-3 · lg grid-cols-4 (3/2).
// ============================================================

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Container, Section, SectionHeader, MotionStagger, MotionStaggerItem } from "@/components/ui";
import type { LandingGalleryTile } from "@/lib/landingIndex";

const FOCUSABLE =
  'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';

export default function LandingGallery({
  tiles,
  title,
}: {
  tiles: LandingGalleryTile[];
  title?: string | null;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusTo = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setOpen(null);
    restoreFocusTo.current?.focus();
  }, []);

  const step = useCallback(
    (dir: number) => {
      setOpen((cur) =>
        cur === null ? cur : (cur + dir + tiles.length) % tiles.length,
      );
    },
    [tiles.length],
  );

  // Keyboard: Esc closes, arrows move, Tab is trapped inside the dialog.
  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "Tab") {
        const nodes = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
        if (!nodes || nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // scroll lock
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, close, step]);

  if (!tiles.length) return null;
  const active = open !== null ? tiles[open] : null;

  return (
    <Section bg="white" pad="md">
      <Container size="xl">
        <SectionHeader eyebrow="Gallery" title={title ?? "A look around"} />
        <MotionStagger className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {tiles.map((t, i) => (
            <MotionStaggerItem
              key={i}
              className={i === 0 ? "col-span-2 sm:col-span-1 lg:col-span-1" : ""}
            >
              <button
                type="button"
                onClick={() => {
                  restoreFocusTo.current =
                    document.activeElement as HTMLElement | null;
                  setOpen(i);
                }}
                aria-label={`Open image ${i + 1}: ${t.alt_text ?? "photo"}`}
                className={`group relative block w-full overflow-hidden rounded-2xl border border-ink-7 bg-ink-1 ${
                  i === 0 ? "aspect-[16/9]" : "aspect-[3/2]"
                }`}
              >
                <Image
                  src={t.image_url}
                  alt={t.alt_text ?? ""}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {t.caption && (
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-left text-xs font-semibold text-white">
                    {t.caption}
                  </span>
                )}
              </button>
            </MotionStaggerItem>
          ))}
        </MotionStagger>
      </Container>

      {active && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>
          {tiles.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
                aria-label="Previous image"
                className="absolute left-3 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 sm:left-6"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
                aria-label="Next image"
                className="absolute right-3 top-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 sm:right-6"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <div
            className="relative max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={active.image_url}
              alt={active.alt_text ?? ""}
              className="mx-auto max-h-[85vh] w-auto object-contain"
            />
            {active.caption && (
              <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-center text-sm text-white">
                {active.caption}
              </p>
            )}
          </div>
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/70">
            {(open ?? 0) + 1} / {tiles.length}
          </p>
        </div>
      )}
    </Section>
  );
}
