/* ============================================================
   WayTero UI primitives — barrel export.
   Import everything from "@/components/ui" — single source of truth.
   ============================================================ */
export { default as Container } from "./Container";
export { Button, ButtonLink } from "./Button";
export { default as Badge } from "./Badge";
export { default as Card, CardHeader, CardTitle, CardSubtitle, CardBody, CardFooter } from "./Card";
export { default as Section } from "./Section";
export { default as SectionHeader } from "./SectionHeader";
export { default as PageHeader } from "./PageHeader";
export { default as Breadcrumb } from "./Breadcrumb";
export type { BreadcrumbItem } from "./Breadcrumb";
export { Field, Input, Textarea, Select } from "./Field";
export { default as IconBox } from "./IconBox";
export { default as Divider } from "./Divider";
export { default as Avatar } from "./Avatar";
export { default as EmptyState } from "./EmptyState";
export { default as Skeleton, SkeletonText } from "./Skeleton";
export { default as PremiumHeading, PremiumTitle } from "./PremiumHeading";

/* Motion primitives — fade, stagger, glow, parallax, tilt, shine, counter, reveal, magnetic */
export {
  MotionFadeIn,
  MotionStagger,
  MotionStaggerItem,
  MotionGlow,
  MotionParallax,
  MotionTilt,
  MotionShine,
  MotionScrollCounter,
  MotionReveal,
  MotionMagnetic,
} from "./Motion";
