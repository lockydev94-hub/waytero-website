import { ReactNode } from "react";
import Container from "./Container";

interface PageHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode; /* optional right-aligned content */
  align?: "center" | "left";
  /** Full-bleed background image (service banner). When set, the header
      switches to the dark banner variant (white text + overlay) so the
      content stays legible over the image. Falls back to the soft
      gradient when omitted. */
  imageUrl?: string;
}

/**
 * PageHeader — used at the top of inner pages (login, about, contact, etc.).
 * Renders a soft gradient background with eyebrow + H1 + optional subtitle.
 * Pass `imageUrl` (e.g. the service type's hero/banner image from the DB)
 * to render a full-bleed banner variant instead.
 */
export default function PageHeader({ eyebrow, title, subtitle, children, align = "center", imageUrl }: PageHeaderProps) {
  const alignCls = align === "center" ? "text-center mx-auto" : "text-left";

  if (imageUrl) {
    return (
      <div className="relative overflow-hidden text-white border-b border-ink-7">
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url("${imageUrl}")` }}
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-ink/80 via-ink/65 to-ink/85" />
        <Container size="lg" className="relative pt-12 pb-10 lg:pt-16 lg:pb-12">
          <div className={`max-w-2xl ${alignCls}`}>
            {eyebrow && (
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white/85 mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-400" aria-hidden />
                {eyebrow}
              </p>
            )}
            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-white leading-[1.1] tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]">
              {title}
            </h1>
            {subtitle && <p className="mt-4 text-base sm:text-lg text-white/75 leading-relaxed">{subtitle}</p>}
          </div>
          {children && <div className="mt-6">{children}</div>}
        </Container>
      </div>
    );
  }

  return (
    <div className="relative bg-gradient-to-br from-primary-50 via-white to-white border-b border-ink-7">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(26,86,219,0.07),_transparent_60%)]" aria-hidden />
      <Container size="lg" className="relative pt-12 pb-10 lg:pt-16 lg:pb-12">
        <div className={`max-w-2xl ${alignCls}`}>
          {eyebrow && (
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary-600 mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-500" aria-hidden />
              {eyebrow}
            </p>
          )}
          <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-ink leading-[1.1] tracking-tight">
            {title}
          </h1>
          {subtitle && <p className="mt-4 text-base sm:text-lg text-ink-3 leading-relaxed">{subtitle}</p>}
        </div>
        {children && <div className="mt-6">{children}</div>}
      </Container>
    </div>
  );
}
