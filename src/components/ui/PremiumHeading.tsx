import { ReactNode } from "react";
import { MotionFadeIn } from "./Motion";

interface PremiumHeadingProps {
  /** HTML element to render (defaults to h2). */
  as?: "h1" | "h2" | "h3" | "h4";
  /** Apply gradient to the title text. */
  gradient?: "primary" | "accent" | "ink" | "none";
  /** Render an animated gradient underline below the title. */
  underline?: boolean;
  /** Apply a fade-up reveal animation. */
  reveal?: boolean;
  /** Eyebrow text above the title. */
  eyebrow?: ReactNode;
  /** Kicker badge above the eyebrow. */
  kicker?: ReactNode;
  /** Subtitle below the title. */
  subtitle?: ReactNode;
  align?: "left" | "center";
  className?: string;
  children?: ReactNode;
}

const GRADIENT: Record<string, string> = {
  primary: "text-gradient-primary",
  accent:  "text-gradient-accent",
  ink:     "text-gradient-ink",
  none:    "text-ink",
};

const SIZES: Record<string, string> = {
  h1: "text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight",
  h2: "text-3xl sm:text-4xl lg:text-[2.6rem] font-extrabold leading-[1.1] tracking-tight",
  h3: "text-2xl sm:text-3xl font-extrabold leading-[1.15] tracking-tight",
  h4: "text-xl sm:text-2xl font-bold leading-[1.2] tracking-tight",
};

/**
 * PremiumHeading — large display heading with built-in gradient text,
 * animated underline, and optional reveal animation. Drop-in replacement
 * for the most common page title patterns.
 *
 * Usage:
 *   <PremiumHeading eyebrow="Why us" gradient="primary" underline>
 *     Built for India
 *   </PremiumHeading>
 */
export default function PremiumHeading({
  as: As = "h2",
  gradient = "none",
  underline = false,
  reveal = true,
  eyebrow,
  kicker,
  subtitle,
  align = "center",
  className = "",
  children,
}: PremiumHeadingProps) {
  const alignCls = align === "center" ? "text-center mx-auto" : "text-left";
  const inner = (
    <div className={`mb-10 lg:mb-12 max-w-3xl ${alignCls} ${className}`}>
      {kicker && <div className="mb-3 inline-flex">{kicker}</div>}
      {eyebrow && (
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary-600 mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-500" aria-hidden />
          {eyebrow}
        </p>
      )}
      <As className={`${SIZES[As]} ${GRADIENT[gradient]}`}>{children}</As>
      {underline && (
        <div
          className={`mt-4 h-1 w-24 rounded-full bg-gradient-to-r from-primary-500 via-primary-600 to-accent-500 ${align === "center" ? "mx-auto" : ""}`}
          aria-hidden
        />
      )}
      {subtitle && <p className="mt-4 text-base sm:text-lg text-ink-3 leading-relaxed">{subtitle}</p>}
    </div>
  );
  return reveal ? <MotionFadeIn>{inner}</MotionFadeIn> : inner;
}

/**
 * PremiumTitle — just the title text with gradient + reveal, no surrounding
 * header chrome. Use when you only need a styled title without eyebrow/subtitle.
 */
export function PremiumTitle({
  as: As = "h2",
  gradient = "primary",
  reveal = true,
  children,
  className = "",
}: {
  as?: "h1" | "h2" | "h3" | "h4";
  gradient?: "primary" | "accent" | "ink" | "none";
  reveal?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const inner = <As className={`${SIZES[As]} ${GRADIENT[gradient]} ${className}`}>{children}</As>;
  return reveal ? <MotionFadeIn>{inner}</MotionFadeIn> : inner;
}
