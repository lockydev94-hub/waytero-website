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
  /** "home" is the tighter homepage scale. "default" is byte-identical to
      what every other page has always rendered. */
  scale?: "default" | "home";
}

const ACCENT: Record<string, string> = {
  primary: "text-gradient-primary",
  accent:  "text-gradient-accent",
  ink:     "text-gradient-ink",
  none:    "",
};

/**
 * The two scales, kept side by side so the homepage can be tightened without
 * moving the 32 other callers. `default` must stay the literal strings this
 * component shipped before `scale` existed.
 */
const SCALE = {
  default: {
    wrap: "mb-10 lg:mb-12",
    eyebrow: "text-xs font-bold uppercase tracking-[0.18em] text-primary-600 mb-3",
    title: "text-3xl sm:text-4xl lg:text-[2.6rem] font-extrabold leading-[1.1] tracking-tight",
    rule: "mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-primary-500 via-primary-600 to-accent-500",
    subtitle: "mt-4 text-base sm:text-lg text-ink-3 leading-relaxed",
    actions: "mt-6",
  },
  home: {
    wrap: "mb-6 lg:mb-7",
    eyebrow: "text-[11px] font-bold uppercase tracking-[0.2em] text-primary-600 mb-2.5",
    // 2.6rem over a 16px subtitle read as shouting; 2.15rem with slightly
    // tighter tracking sits level with the copy under it.
    title: "text-2xl sm:text-[1.9rem] lg:text-[2.15rem] font-extrabold leading-[1.15] tracking-[-0.02em]",
    rule: "mt-3 h-[3px] w-14 rounded-full bg-gradient-to-r from-primary-500 via-primary-600 to-accent-500",
    subtitle: "mt-3 text-[15px] sm:text-base text-ink-3 leading-relaxed",
    actions: "mt-5",
  },
} as const;

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
  scale = "default",
}: SectionHeaderProps) {
  const alignCls = align === "center" ? "text-center mx-auto" : "text-left";
  const s = SCALE[scale];
  return (
    <div className={`${s.wrap} max-w-2xl ${alignCls} ${className}`}>
      {kicker && (
        <div className="mb-3 inline-flex">
          {kicker}
        </div>
      )}
      {eyebrow && (
        <p className={`inline-flex items-center gap-2 ${s.eyebrow} ${animatedEyebrow ? "hover-shine rounded-full px-3 py-1" : ""}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-accent-500" aria-hidden />
          {eyebrow}
        </p>
      )}
      <h2
        className={`${s.title} ${
          ACCENT[accent] || "text-ink"
        }`}
      >
        {title}
      </h2>
      {underline && (
        <div className={`${s.rule} ${align === "center" ? "mx-auto" : ""}`} aria-hidden />
      )}
      {subtitle && (
        <p className={s.subtitle}>{subtitle}</p>
      )}
      {actions && <div className={s.actions}>{actions}</div>}
    </div>
  );
}
