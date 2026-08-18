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
type Padding = "sm" | "md" | "lg" | "none";

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
  lg: "py-20 lg:py-28",
};

type Divider = "top" | "bottom" | "both" | "none";

interface SectionProps {
  bg?: Bg;
  pad?: Padding;
  id?: string;
  className?: string;
  /** Adds a soft fade divider above/below the section. */
  divider?: Divider;
  /** Pattern overlay on top of bg. Useful for ink/dark sections. */
  overlay?: "dots" | "grid" | "lines" | "none";
  children: ReactNode;
}

const OVERLAY: Record<"dots" | "grid" | "lines" | "none", string> = {
  none: "",
  dots:  "before:content-[''] before:absolute before:inset-0 before:bg-dot-light before:opacity-40 before:pointer-events-none",
  grid:  "before:content-[''] before:absolute before:inset-0 before:bg-grid-light before:opacity-40 before:pointer-events-none",
  lines: "before:content-[''] before:absolute before:inset-0 before:bg-lines-faint before:opacity-60 before:pointer-events-none",
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
