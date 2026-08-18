import { ReactNode } from "react";

type Tone = "primary" | "accent" | "success" | "warning" | "danger" | "info" | "neutral" | "ink";
type Size = "sm" | "md" | "lg" | "xl";

const TONE: Record<Tone, string> = {
  primary: "bg-primary-50 text-primary-600",
  accent:  "bg-accent-100 text-accent-700",
  success: "bg-success-soft text-emerald-700",
  warning: "bg-warning-soft text-amber-700",
  danger:  "bg-danger-soft text-red-700",
  info:    "bg-info-soft text-sky-700",
  neutral: "bg-ink-8 text-ink-2",
  ink:     "bg-ink-900 text-white",
};

const TONE_GRADIENT: Record<Tone, string> = {
  primary: "bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-wt-primary",
  accent:  "bg-gradient-to-br from-accent-400 to-accent-600 text-white shadow-wt-accent",
  success: "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white",
  warning: "bg-gradient-to-br from-amber-400 to-amber-600 text-white",
  danger:  "bg-gradient-to-br from-red-500 to-red-700 text-white",
  info:    "bg-gradient-to-br from-sky-400 to-sky-600 text-white",
  neutral: "bg-gradient-to-br from-ink-3 to-ink-5 text-white",
  ink:     "bg-gradient-to-br from-ink-800 to-ink-900 text-white shadow-wt-elev-2",
};

const SIZE: Record<Size, string> = {
  sm: "h-9 w-9 rounded-lg",
  md: "h-12 w-12 rounded-xl",
  lg: "h-14 w-14 rounded-2xl",
  xl: "h-20 w-20 rounded-3xl",
};

const ICON_SIZE: Record<Size, string> = {
  sm: "[&>svg]:h-4 [&>svg]:w-4",
  md: "[&>svg]:h-6 [&>svg]:w-6",
  lg: "[&>svg]:h-7 [&>svg]:w-7",
  xl: "[&>svg]:h-9 [&>svg]:w-9",
};

interface IconBoxProps {
  icon: ReactNode;
  tone?: Tone;
  size?: Size;
  className?: string;
  /** Use a gradient background (overrides flat tone). */
  gradient?: boolean;
  /** Wrap the icon in a soft glow halo. */
  glow?: boolean;
  /** Apply a gentle floating animation. */
  float?: boolean;
}

/**
 * IconBox — uniformly-styled icon container used in features, services, advantages.
 * The icon prop is expected to be a Lucide icon component.
 */
export default function IconBox({
  icon,
  tone = "primary",
  size = "md",
  className = "",
  gradient = false,
  glow = false,
  float = false,
}: IconBoxProps) {
  const base = gradient ? TONE_GRADIENT[tone] : TONE[tone];
  const motion = float ? "[animation:var(--animate-float-soft)]" : "";
  const glowRing = glow
    ? "ring-4 ring-offset-2 ring-offset-white ring-primary-100/70 [animation:var(--animate-pulse-soft)]"
    : "";

  return (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 ${base} ${SIZE[size]} ${ICON_SIZE[size]} ${motion} ${glowRing} transition-transform duration-300 hover:scale-110 hover:-rotate-3 ${className}`}
    >
      {icon}
      {glow && (
        <span
          aria-hidden
          className="absolute inset-0 -z-10 rounded-inherit blur-xl opacity-60"
          style={{
            background: gradient
              ? "currentColor"
              : tone === "primary" ? "rgba(26, 86, 219, 0.35)"
              : tone === "accent"  ? "rgba(240, 90, 34, 0.35)"
              : "rgba(11, 27, 59, 0.25)",
            color: tone === "primary" ? "#1A56DB" : tone === "accent" ? "#F05A22" : "currentColor",
            borderRadius: "inherit",
          }}
        />
      )}
    </div>
  );
}
