"use client";

import { motion, useMotionValue, useSpring, useTransform, useScroll, useInView, animate, Variants } from "framer-motion";
import { ReactNode, useEffect, useRef, useState } from "react";

/* ============================================================
   WayTero motion primitives — premium polish suite.

   These wrap Framer Motion with friendly presets tuned for the
   WayTero brand. Use them inside any client component.

   Conventions:
   - `delay`  = seconds
   - `y`      = initial translateY in px
   - `speed`  = -1 (slower) ... 1 (faster) for parallax
   - `max`    = max tilt degrees
   ============================================================ */

const EASE = [0.22, 1, 0.36, 1] as const;
const SPRING = { type: "spring" as const, stiffness: 260, damping: 26 };

/* ── Existing primitives ───────────────────────────────────── */

/**
 * MotionFadeIn — slide-up + fade-in on viewport entry.
 * Use for hero content, section reveals, standalone elements.
 */
export function MotionFadeIn({
  children,
  delay = 0,
  y = 16,
  className = "",
  duration = 0.6,
  as: As = "div",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  duration?: number;
  as?: keyof JSX.IntrinsicElements;
}) {
  const Comp = motion[As as keyof typeof motion] as any;
  return (
    <Comp
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration, ease: EASE, delay }}
      className={className}
    >
      {children}
    </Comp>
  );
}

/**
 * MotionStagger — staggered children reveal.
 * Wrap with `MotionStagger` and each direct child should be `<MotionStaggerItem>`.
 */
const container: Variants = {
  hidden: { opacity: 1 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export function MotionStagger({
  children,
  className = "",
  as: As = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}) {
  const Comp = motion[As as keyof typeof motion] as any;
  return (
    <Comp initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} variants={container} className={className}>
      {children}
    </Comp>
  );
}

export function MotionStaggerItem({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={item} className={className}>
      {children}
    </motion.div>
  );
}

/* ── New premium primitives ─────────────────────────────────── */

/**
 * MotionGlow — radial gradient follows the mouse on hover.
 * Wrap a card or interactive element. The glow sits behind content.
 */
export function MotionGlow({
  children,
  color = "primary",
  intensity = 0.35,
  className = "",
  size = 320,
}: {
  children: ReactNode;
  color?: "primary" | "accent" | "success" | "danger";
  intensity?: number;
  className?: string;
  size?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const springX = useSpring(mx, { stiffness: 200, damping: 30 });
  const springY = useSpring(my, { stiffness: 200, damping: 30 });

  const COLORS: Record<string, string> = {
    primary: `rgba(26, 86, 219, ${intensity})`,
    accent: `rgba(240, 90, 34, ${intensity})`,
    success: `rgba(16, 185, 129, ${intensity})`,
    danger: `rgba(239, 68, 68, ${intensity})`,
  };

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        mx.set((e.clientX - rect.left) / rect.width);
        my.set((e.clientY - rect.top) / rect.height);
      }}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -z-0"
        style={{
          width: size,
          height: size,
          left: useTransform(springX, (v) => `calc(${v * 100}% - ${size / 2}px)`),
          top: useTransform(springY, (v) => `calc(${v * 100}% - ${size / 2}px)`),
          background: `radial-gradient(circle, ${COLORS[color]} 0%, transparent 70%)`,
          filter: "blur(40px)",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/**
 * MotionParallax — translates children based on scroll progress.
 * `speed` is -1..1. Negative = moves slower than scroll; positive = faster.
 */
export function MotionParallax({
  children,
  speed = 0.2,
  className = "",
}: {
  children: ReactNode;
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  // Map 0..1 to 0..(speed*100)px translation
  const range = speed * 120;
  const y = useTransform(scrollYProgress, [0, 1], [-range, range]);
  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}

/**
 * MotionTilt — 3D tilt that follows the mouse on hover.
 * Best wrapped around cards. Uses CSS perspective for depth.
 */
export function MotionTilt({
  children,
  max = 8,
  perspective = 1000,
  className = "",
}: {
  children: ReactNode;
  max?: number;
  perspective?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(my, [0, 1], [max, -max]), SPRING as any);
  const rotateY = useSpring(useTransform(mx, [0, 1], [-max, max]), SPRING as any);

  return (
    <div
      ref={ref}
      className={`perspective-1000 ${className}`}
      style={{ perspective }}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        mx.set((e.clientX - rect.left) / rect.width);
        my.set((e.clientY - rect.top) / rect.height);
      }}
      onMouseLeave={() => {
        mx.set(0.5);
        my.set(0.5);
      }}
    >
      <motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}>{children}</motion.div>
    </div>
  );
}

/**
 * MotionShine — one-time light sweep on hover (or on viewport entry).
 * Wraps children with a pseudo-element overlay that animates across once.
 */
export function MotionShine({
  children,
  trigger = "hover",
  className = "",
}: {
  children: ReactNode;
  trigger?: "hover" | "view";
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [shouldShine, setShouldShine] = useState(false);

  useEffect(() => {
    if (trigger === "view" && isInView) setShouldShine(true);
  }, [trigger, isInView]);

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={() => trigger === "hover" && setShouldShine(true)}
    >
      {children}
      {shouldShine && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20"
          initial={{ x: "-150%", skewX: -20, opacity: 0 }}
          animate={{ x: "220%", opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.1, ease: EASE }}
          onAnimationComplete={() => setShouldShine(false)}
          style={{
            background: "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.45) 50%, transparent 70%)",
          }}
        />
      )}
    </div>
  );
}

/**
 * MotionScrollCounter — counts up to `value` when scrolled into view.
 * Use for stats, milestones, animated numbers.
 */
export function MotionScrollCounter({
  value,
  duration = 1.6,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
}: {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const motionVal = useMotionValue(0);
  const formatted = useTransform(motionVal, (v) => `${prefix}${Number(v).toFixed(decimals)}${suffix}`);

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(motionVal, value, { duration, ease: EASE });
    return () => controls.stop();
  }, [isInView, value, duration, motionVal]);

  return <motion.span ref={ref} className={className}>{formatted as any}</motion.span>;
}

/**
 * MotionReveal — generic reveal with direction + optional scale/blur.
 */
export function MotionReveal({
  children,
  direction = "up",
  delay = 0,
  duration = 0.6,
  className = "",
  once = true,
}: {
  children: ReactNode;
  direction?: "up" | "down" | "left" | "right" | "scale" | "blur";
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
}) {
  const HIDDEN: Record<string, any> = {
    up:    { opacity: 0, y: 30 },
    down:  { opacity: 0, y: -30 },
    left:  { opacity: 0, x: 30 },
    right: { opacity: 0, x: -30 },
    scale: { opacity: 0, scale: 0.92 },
    blur:  { opacity: 0, filter: "blur(8px)" },
  };
  const VISIBLE: Record<string, any> = {
    up:    { opacity: 1, y: 0 },
    down:  { opacity: 1, y: 0 },
    left:  { opacity: 1, x: 0 },
    right: { opacity: 1, x: 0 },
    scale: { opacity: 1, scale: 1 },
    blur:  { opacity: 1, filter: "blur(0px)" },
  };
  return (
    <motion.div
      initial={HIDDEN[direction]}
      whileInView={VISIBLE[direction]}
      viewport={{ once, margin: "-60px" }}
      transition={{ duration, ease: EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * MotionMagnetic — small follow effect for buttons/icons.
 * Useful for primary CTAs and icon boxes for an extra-premium feel.
 */
export function MotionMagnetic({
  children,
  strength = 0.25,
  className = "",
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18 });
  const sy = useSpring(y, { stiffness: 220, damping: 18 });

  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        x.set((e.clientX - cx) * strength);
        y.set((e.clientY - cy) * strength);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      <motion.div style={{ x: sx, y: sy }}>{children}</motion.div>
    </div>
  );
}
