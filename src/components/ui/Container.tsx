import { ReactNode, HTMLAttributes } from "react";

/**
 * WayTero Container — fixed max-width wrapper with consistent padding.
 * Pages should wrap content in <Container> for consistent gutters.
 *
 * Sizes:
 *  - sm  (max-w-3xl, ≈768px) — article pages, single-column forms
 *  - md  (max-w-5xl, ≈1024px) — booking detail, profile
 *  - lg  (max-w-6xl, ≈1152px) — homepage, marketing
 *  - xl  (max-w-7xl, ≈1280px) — wide dashboards
 *  - wide (max-w-[1600px]) — homepage bands since the 2026-11 design pass:
 *         the gutters shrink to the padding alone on laptops, but the page
 *         still stops before a 27" monitor stretches every card row.
 *  - full (max-w-full) — full-bleed sections
 */
type ContainerSize = "sm" | "md" | "lg" | "xl" | "wide" | "full";

const SIZE: Record<ContainerSize, string> = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  // `lg:px-14` clears the fixed enquiry / feedback tabs pinned to the left
  // edge (≈52px wide) — at the shared px-8 they sat on top of the first
  // column of text.
  wide: "max-w-[1600px] lg:px-14",
  full: "max-w-full",
};

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: ContainerSize;
  children: ReactNode;
}

export default function Container({
  size = "lg",
  className = "",
  children,
  ...rest
}: ContainerProps) {
  return (
    <div
      className={`mx-auto w-full px-4 sm:px-6 lg:px-8 ${SIZE[size]} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
