import { ReactNode, HTMLAttributes, forwardRef } from "react";

type Variant = "default" | "outline" | "elevated" | "glass" | "flat" | "premium" | "glass-strong" | "flat-elev";

const VARIANT: Record<Variant, string> = {
  default:      "bg-white border border-ink-7 shadow-wt-sm",
  outline:      "bg-white border border-ink-7",
  elevated:     "bg-white border border-ink-7 shadow-wt",
  glass:        "bg-white/70 backdrop-blur-xl border border-white/40 shadow-wt",
  "glass-strong": "bg-white/80 backdrop-blur-2xl border border-white/60 shadow-wt-lg",
  flat:         "bg-ink-9 border border-transparent",
  premium:      "bg-white border border-ink-7 shadow-wt-sm hover:border-primary-200",
  "flat-elev":  "bg-white border border-transparent shadow-wt",
};

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  /** Adds hover-lift + hover-glow transition. Use for clickable cards. */
  hover?: boolean;
  /** Stronger lift on hover (-translate-y-1.5 + shadow-wt-xl). */
  lift?: "sm" | "md" | "lg";
  /** Adds a one-time shine sweep on hover. */
  shine?: boolean;
  /** Adds a one-time shine sweep on viewport entry. */
  shineOnView?: boolean;
  /** Tints the card with a colored background on hover. */
  hoverTint?: "primary" | "accent" | "success" | "info" | "none";
  /** Inner padding. */
  padded?: boolean;
  /** Use gradient-border effect. Overrides default border. */
  gradientBorder?: "primary" | "accent" | "none";
  children: ReactNode;
}

const LIFT: Record<"sm" | "md" | "lg", string> = {
  sm: "hover:-translate-y-1 hover:shadow-wt",
  md: "hover:-translate-y-1.5 hover:shadow-wt-lg",
  lg: "hover:-translate-y-2 hover:shadow-wt-xl",
};

const TINT: Record<string, string> = {
  primary: "hover:bg-primary-50/30",
  accent:  "hover:bg-accent-50/40",
  success: "hover:bg-success-soft/30",
  info:    "hover:bg-info-soft/30",
  none:    "",
};

const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  {
    variant = "default",
    hover = false,
    lift = "md",
    shine = false,
    shineOnView = false,
    hoverTint = "none",
    padded = true,
    gradientBorder = "none",
    className = "",
    children,
    ...rest
  },
  ref,
) {
  // Gradient border: override the variant border with the animated one
  const baseVariant = gradientBorder !== "none" ? "bg-white" : VARIANT[variant];
  const gradBorder =
    gradientBorder === "primary" ? "border-gradient-primary" :
    gradientBorder === "accent"  ? "border-gradient-accent" : "";

  const classes = [
    "rounded-2xl",
    baseVariant,
    padded ? "p-6" : "",
    hover ? `transition-all duration-300 ease-[var(--ease-wt)] ${LIFT[lift]}` : "",
    hover && hoverTint !== "none" ? TINT[hoverTint] : "",
    shine ? "hover-shine" : "",
    gradBorder,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // Lazy-attach the view-shine trigger via wrapper element to avoid ref juggling
  const inner = shineOnView ? (
    <div className="relative overflow-hidden rounded-2xl h-full">
      {children}
      <span aria-hidden className="pointer-events-none absolute inset-0" data-shine-on-view />
    </div>
  ) : (
    children
  );

  return (
    <div ref={ref} className={classes} {...rest}>
      {inner}
    </div>
  );
});

export default Card;

/* ── Card subcomponents — composable ───────────────────────── */
export function CardHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={`text-lg font-bold text-ink tracking-tight ${className}`}>{children}</h3>
  );
}

export function CardSubtitle({ children, className = "", gradient = false }: { children: ReactNode; className?: string; gradient?: boolean }) {
  return (
    <p className={`text-sm mt-1 ${gradient ? "text-gradient-primary font-semibold" : "text-ink-3"} ${className}`}>{children}</p>
  );
}

export function CardBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`text-ink-2 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mt-5 pt-4 border-t border-ink-7 flex items-center gap-3 ${className}`}>{children}</div>
  );
}
