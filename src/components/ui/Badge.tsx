import { ReactNode, HTMLAttributes } from "react";

type Tone = "primary" | "accent" | "success" | "warning" | "danger" | "info" | "neutral";

const TONE: Record<Tone, string> = {
  primary: "bg-primary-50 text-primary-700 border border-primary-100",
  accent:  "bg-accent-100 text-accent-700 border border-accent-200",
  success: "bg-success-soft text-emerald-700 border border-emerald-100",
  warning: "bg-warning-soft text-amber-700 border border-amber-100",
  danger:  "bg-danger-soft text-red-700 border border-red-100",
  info:    "bg-info-soft text-sky-700 border border-sky-100",
  neutral: "bg-ink-8 text-ink-3 border border-ink-7",
};

type Size = "sm" | "md";

const SIZE: Record<Size, string> = {
  sm: "px-2 py-0.5 text-[10px] gap-1",
  md: "px-2.5 py-1 text-xs gap-1.5",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  size?: Size;
  icon?: ReactNode;
  dot?: boolean;
  children: ReactNode;
}

export default function Badge({
  tone = "primary",
  size = "md",
  icon,
  dot,
  className = "",
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold uppercase tracking-wider ${TONE[tone]} ${SIZE[size]} ${className}`}
      {...rest}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
      {icon}
      {children}
    </span>
  );
}
