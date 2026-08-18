"use client";

import { forwardRef, ButtonHTMLAttributes, ReactNode, useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

type Variant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "accent"
  | "danger"
  | "subtle"
  | "gradient-primary"
  | "gradient-accent"
  | "outline-glow";
type Size = "sm" | "md" | "lg" | "xl";

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-primary-600 text-white shadow-wt-primary hover:bg-primary-700 active:bg-primary-800 focus-visible:ring-primary-600",
  secondary:
    "bg-ink-9 text-ink hover:bg-ink-8 border border-ink-7 focus-visible:ring-ink-4",
  outline:
    "bg-transparent text-primary-600 border border-primary-600 hover:bg-primary-50 focus-visible:ring-primary-600",
  ghost:
    "bg-transparent text-ink-2 hover:bg-ink-9 focus-visible:ring-ink-4",
  accent:
    "bg-accent-500 text-ink shadow-wt-accent hover:bg-accent-600 hover:text-white focus-visible:ring-accent-500",
  danger:
    "bg-danger text-white hover:bg-red-600 focus-visible:ring-danger",
  subtle:
    "bg-primary-50 text-primary-700 hover:bg-primary-100 focus-visible:ring-primary-600",
  "gradient-primary":
    "text-white shadow-wt-primary bg-[length:200%_200%] bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 hover:bg-[position:100%_0] focus-visible:ring-primary-600",
  "gradient-accent":
    "text-white shadow-wt-accent bg-[length:200%_200%] bg-gradient-to-br from-accent-400 via-accent-500 to-accent-700 hover:bg-[position:100%_0] focus-visible:ring-accent-500",
  "outline-glow":
    "bg-transparent text-ink border-2 border-transparent [background:linear-gradient(white,white)_padding-box,linear-gradient(135deg,#1A56DB_0%,#3563F0_25%,#F05A22_75%,#1A56DB_100%)_border-box] hover:shadow-wt-glow-primary focus-visible:ring-primary-600",
};

const SIZE: Record<Size, string> = {
  sm: "h-9 px-3 text-sm rounded-lg gap-1.5",
  md: "h-11 px-5 text-sm rounded-xl gap-2",
  lg: "h-12 px-6 text-base rounded-xl gap-2",
  xl: "h-14 px-8 text-lg rounded-2xl gap-2.5",
};

const baseClasses =
  "relative inline-flex items-center justify-center font-semibold tracking-tight transition-all duration-300 ease-[var(--ease-wt)] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white " +
  "disabled:opacity-50 disabled:pointer-events-none select-none whitespace-nowrap overflow-hidden " +
  "active:scale-[0.98]";

/* ── Magnetic wrapper — adds a mouse-follow offset to any child element.
   Uses CSS transform only (no layout shift), respects reduced-motion via the
   transition-duration going to ~0. */
function MagneticWrap({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  useEffect(() => {
    if (!enabled) return;
    const el = wrapRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      setOffset({ x: (e.clientX - cx) * 0.12, y: (e.clientY - cy) * 0.12 });
    };
    const onLeave = () => setOffset({ x: 0, y: 0 });
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [enabled]);

  return (
    <span
      ref={wrapRef}
      className={
        enabled
          ? "inline-block transition-transform duration-200 ease-[var(--ease-wt-spring)]"
          : "inline-block"
      }
      style={enabled ? { transform: `translate(${offset.x}px, ${offset.y}px)` } : undefined}
    >
      {children}
    </span>
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  /** Adds a one-time shine sweep on hover. */
  shine?: boolean;
  /** Small mouse-follow offset for a magnetic feel. */
  magnetic?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth,
    shine = false,
    magnetic = false,
    className = "",
    children,
    disabled,
    ...rest
  },
  ref,
) {
  const cls = `${baseClasses} ${VARIANT[variant]} ${SIZE[size]} ${fullWidth ? "w-full" : ""} ${shine ? "hover-shine" : ""} ${className}`;
  return (
    <MagneticWrap enabled={magnetic}>
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cls}
        {...rest}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : leftIcon}
        <span>{children}</span>
        {!loading && rightIcon}
      </button>
    </MagneticWrap>
  );
});

/* ── ButtonLink — same look, navigates via next/link ──────── */
interface ButtonLinkProps
  extends Omit<ButtonHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
  external?: boolean;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  /** Adds a one-time shine sweep on hover. */
  shine?: boolean;
  /** Small mouse-follow offset for a magnetic feel. */
  magnetic?: boolean;
  className?: string;
  children: ReactNode;
}

export function ButtonLink({
  href,
  external,
  variant = "primary",
  size = "md",
  loading,
  leftIcon,
  rightIcon,
  fullWidth,
  shine = false,
  magnetic = false,
  className = "",
  children,
  ...rest
}: ButtonLinkProps) {
  const cls = `${baseClasses} ${VARIANT[variant]} ${SIZE[size]} ${fullWidth ? "w-full" : ""} ${shine ? "hover-shine" : ""} ${className}`;
  const inner = (
    <>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : leftIcon}
      <span>{children}</span>
      {!loading && rightIcon}
    </>
  );
  const linkEl = external ? (
    <a href={href} className={cls} {...rest}>
      {inner}
    </a>
  ) : (
    <Link href={href} className={cls} {...rest}>
      {inner}
    </Link>
  );
  return <MagneticWrap enabled={magnetic}>{linkEl}</MagneticWrap>;
}
