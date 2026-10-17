import { ReactNode } from "react";

type Bg =
  | "white"
  | "muted"
  | "gradient"
  | "ink"
  | "mesh-primary"
  | "mesh-accent"
  | "mesh-ink"
  | "grid"
  | "dot"
  | "noise";
type Padding = "sm" | "md" | "lg" | "home" | "tight" | "none";

const BG: Record<Bg, string> = {
  white:           "bg-white",
  muted:           "bg-ink-9",
  gradient:        "bg-gradient-to-br from-primary-50 via-white to-accent-50",
  ink:             "bg-ink-900 text-white",
  "mesh-primary":  "bg-mesh-primary text-ink",
  "mesh-accent":   "bg-mesh-accent text-ink",
  "mesh-ink":      "bg-mesh-ink text-white",
  grid:            "bg-white bg-grid-faint",
  dot:             "bg-white bg-dot-faint",
  noise:           "bg-white bg-noise",
};

const PAD: Record<Padding, string> = {
  none: "",
  sm: "py-12 lg:py-16",
  md: "py-16 lg:py-20",
  // `lg` used to be py-20 lg:py-28. Every marketing page stacked two or three
  // of them and the top of a page paid it on top of PageHeader's own padding,
  // which read as dead space rather than design. It stays the roomiest step in
  // the ladder (py-16 lg:py-24) so it remains strictly larger than `md`.
  lg: "py-16 lg:py-24",
  // Homepage bands stack 16 deep, so they keep the tightest rhythm of all.
  home: "py-10 lg:py-14",
  // A service page (e.g. /cabs) runs nine short bands back to back; at the
  // homepage's 112px between bands the whitespace reads as loose because each
  // band here is small. `tight` (72px between bands) is the densest step —
  // still monotonic, and only opt-in per page so the homepage is untouched.
  tight: "py-8 lg:py-9",
};

type Divider = "top" | "bottom" | "both" | "none";

interface SectionProps {
  bg?: Bg;
  pad?: Padding;
  id?: string;
  className?: string;
  /** Adds a soft fade divider above/below the section. */
  divider?: Divider;
  /** Pattern overlay on top of bg. `dots`/`grid` are white — for ink
      surfaces; `dots-faint`/`grid-faint` are navy — for light ones. */
  overlay?: "dots" | "grid" | "lines" | "dots-faint" | "grid-faint" | "none";
  children: ReactNode;
}

const OVERLAY: Record<"dots" | "grid" | "lines" | "dots-faint" | "grid-faint" | "none", string> = {
  none: "",
  dots:  "before:content-[''] before:absolute before:inset-0 before:bg-dot-light before:opacity-40 before:pointer-events-none",
  grid:  "before:content-[''] before:absolute before:inset-0 before:bg-grid-light before:opacity-40 before:pointer-events-none",
  lines: "before:content-[''] before:absolute before:inset-0 before:bg-lines-faint before:opacity-60 before:pointer-events-none",
  // The white patterns above are invisible on a white/off-white band, which is
  // why every light homepage section's `overlay` did nothing. These are the
  // navy-on-light counterparts.
  "dots-faint": "before:content-[''] before:absolute before:inset-0 before:bg-dot-faint before:opacity-40 before:pointer-events-none",
  "grid-faint": "before:content-[''] before:absolute before:inset-0 before:bg-grid-faint before:opacity-40 before:pointer-events-none",
};

const DIVIDER: Record<Divider, string> = {
  none: "",
  top: "before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-ink-6/60 before:to-transparent",
  bottom: "after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-ink-6/60 after:to-transparent",
  both: "before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-ink-6/60 before:to-transparent after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-ink-6/60 after:to-transparent",
};

/**
 * Section — consistent vertical rhythm + background variants for marketing pages.
 */
export default function Section({
  bg = "white",
  pad = "md",
  id,
  className = "",
  divider = "none",
  overlay = "none",
  children,
}: SectionProps) {
  return (
    <section
      id={id}
      className={`relative ${BG[bg]} ${PAD[pad]} ${OVERLAY[overlay]} ${DIVIDER[divider]} ${className}`}
    >
      <div className="relative z-10">{children}</div>
    </section>
  );
}
