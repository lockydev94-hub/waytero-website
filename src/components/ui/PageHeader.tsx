import { ReactNode } from "react";
import Container from "./Container";

interface PageHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode; /* optional right-aligned content */
  align?: "center" | "left";
}

/**
 * PageHeader — used at the top of inner pages (track, about, contact, legal).
 * Renders a soft gradient with eyebrow + H1 + optional subtitle.
 *
 * The service listing pages (cabs, hotels, tours) build their own hero because
 * they carry a search card and the admin's banner image; this one stays the
 * plain text header so the simpler pages have something to reach for.
 */
export default function PageHeader({ eyebrow, title, subtitle, children, align = "center" }: PageHeaderProps) {
  const alignCls = align === "center" ? "text-center mx-auto" : "text-left";

  return (
    <div className="relative bg-gradient-to-br from-primary-50 via-white to-white border-b border-ink-7">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(26,86,219,0.07),_transparent_60%)]" aria-hidden />
      {/* The band that holds this already pads itself; keeping this small is
          what stops the header-to-headline gap doubling up. */}
      <Container size="lg" className="relative pt-8 pb-8 lg:pt-10 lg:pb-10">
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
