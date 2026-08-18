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
 *  - full (max-w-full) — full-bleed sections
 */
type ContainerSize = "sm" | "md" | "lg" | "xl" | "full";

const SIZE: Record<ContainerSize, string> = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
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
