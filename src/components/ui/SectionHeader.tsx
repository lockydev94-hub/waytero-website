import { ReactNode } from "react";

interface SectionHeaderProps {
  eyebrow?: ReactNode;
  /** Kicker badge above the eyebrow (e.g., "Popular", "New"). */
  kicker?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "left" | "center";
  className?: string;
  actions?: ReactNode;
  /** Use gradient text on the title. */
  accent?: "primary" | "accent" | "ink" | "none";
  /** Show an animated gradient underline below the title. */
  underline?: boolean;
  /** Apply a subtle shine sweep to the eyebrow. */
  animatedEyebrow?: boolean;
}

const ACCENT: Record<string, string> = {
  primary: "text-gradient-primary",
  accent:  "text-gradient-accent",
  ink:     "text-gradient-ink",
  none:    "",
};

/**
 * SectionHeader — consistent H2 + eyebrow + sub used across marketing pages.
 */
export default function SectionHeader({
  eyebrow,
  kicker,
  title,
  subtitle,
  align = "center",
  className = "",
  actions,
  accent = "none",
  underline = false,
  animatedEyebrow = false,
}: SectionHeaderProps) {
  const alignCls = align === "center" ? "text-center mx-auto" : "text-left";
  return (
    <div className={`mb-10 lg:mb-12 max-w-2xl ${alignCls} ${className}`}>
      {kicker && (
        <div className="mb-3 inline-flex">
          {kicker}
        </div>
      )}
      {eyebrow && (
        <p className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary-600 mb-3 ${animatedEyebrow ? "hover-shine rounded-full px-3 py-1" : ""}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-accent-500" aria-hidden />
          {eyebrow}
        </p>
      )}
      <h2
        className={`text-3xl sm:text-4xl lg:text-[2.6rem] font-extrabold leading-[1.1] tracking-tight ${
          ACCENT[accent] || "text-ink"
        }`}
      >
        {title}
      </h2>
      {underline && (
        <div className={`mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-primary-500 via-primary-600 to-accent-500 ${align === "center" ? "mx-auto" : ""}`} aria-hidden />
      )}
      {subtitle && (
        <p className="mt-4 text-base sm:text-lg text-ink-3 leading-relaxed">{subtitle}</p>
      )}
      {actions && <div className="mt-6">{actions}</div>}
    </div>
  );
}
