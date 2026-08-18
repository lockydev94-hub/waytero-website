import Link from "next/link";
import Image from "next/image";
import {
  Facebook, Twitter, Instagram, Linkedin, Youtube,
  Smartphone, Globe, ShieldCheck, ArrowRight, Mail,
} from "lucide-react";
import { Container, MotionGlow } from "@/components/ui";
import type { SiteFooterData } from "@/types/cms";

// ── Fallback data ──────────────────────────────────────────────
const DEFAULT_COLUMNS = [
  {
    title: "Services",
    links: [
      { label: "Book a Cab",    href: "/cabs" },
      { label: "Find Hotels",   href: "/hotels" },
      { label: "Tour Packages", href: "/tours" },
      { label: "Live Tracking", href: "/track" },
      { label: "Travel Wallet", href: "/wallet" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us",         href: "/about" },
      { label: "Careers",          href: "/careers" },
      { label: "Become a Partner", href: "/partner" },
      { label: "Travel Blog",      href: "/blog" },
      { label: "Press & Media",    href: "/press" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center",          href: "/support" },
      { label: "Contact Us",           href: "/contact" },
      { label: "Safety",               href: "/safety" },
      { label: "Booking Instructions", href: "/booking-instructions" },
      { label: "Cancellation Policy",  href: "/refund" },
      { label: "Sitemap",              href: "/sitemap" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy",   href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Refund Policy",    href: "/refund" },
      { label: "Cookies",          href: "/cookies" },
      { label: "Account Deletion", href: "/account-deletion" },
    ],
  },
];

const SOCIAL_META = [
  { icon: Facebook,  label: "Facebook",  key: "facebook" },
  { icon: Twitter,   label: "Twitter",   key: "twitter" },
  { icon: Instagram, label: "Instagram", key: "instagram" },
  { icon: Linkedin,  label: "LinkedIn",  key: "linkedin" },
  { icon: Youtube,   label: "YouTube",   key: "youtube" },
];

const DEFAULT_DESCRIPTION =
  "India's Travel Operating System — connecting customers, partners, drivers, hotels, and tour operators on one seamless platform.";
const DEFAULT_COPYRIGHT = `© ${new Date().getFullYear()} WayTero Travel Technologies Pvt Ltd · CIN U63090OR2023PTC`;

interface Props {
  cmsData?: SiteFooterData | null;
}

export default function Footer({ cmsData }: Props) {
  const logoUrl     = cmsData?.logo_url      ?? null;
  const description = cmsData?.description   ?? DEFAULT_DESCRIPTION;
  const copyright   = cmsData?.copyright_text ?? DEFAULT_COPYRIGHT;
  const androidLink = cmsData?.app_store_links?.android ?? "#";
  const iosLink     = cmsData?.app_store_links?.ios     ?? "#";
  const socialMap   = (cmsData?.social_links ?? {}) as Record<string, string>;

  const quickLinks = cmsData?.quick_links && cmsData.quick_links.length > 0
    ? [{ title: "Quick Links", links: cmsData.quick_links }]
    : [];
  const legalLinks = cmsData?.legal_links && cmsData.legal_links.length > 0
    ? [{ title: "Legal", links: cmsData.legal_links }]
    : [];
  const footerColumns =
    quickLinks.length > 0 || legalLinks.length > 0
      ? [...quickLinks, ...DEFAULT_COLUMNS.slice(1, 3), ...legalLinks]
      : DEFAULT_COLUMNS;

  return (
    <footer
      className="relative overflow-hidden"
      style={{ background: "linear-gradient(175deg, #0B1B3B 0%, #061122 100%)" }}
    >
      {/* ── Background texture ── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[400px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse,rgba(26,86,219,0.12) 0%,transparent 70%)" }} />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse,rgba(245,158,11,0.07) 0%,transparent 70%)" }} />

      {/* Mouse-tracking accent glow in top-right */}
      <MotionGlow
        color="primary"
        intensity={0.35}
        className="absolute inset-0 pointer-events-none"
      >
        <span aria-hidden className="hidden" />
      </MotionGlow>

      {/* ── Newsletter ── */}
      <div className="relative border-b border-white/[0.06]">
        <Container size="xl" className="py-12 lg:py-14 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3"
              style={{ background: "rgba(245,158,11,0.12)", color: "#F05A22", border: "1px solid rgba(245,158,11,0.2)" }}>
              ✦ Travel smarter
            </div>
            <h3 className="text-white text-2xl font-bold tracking-tight leading-snug">
              Handpicked deals, route tips &<br className="hidden sm:block" /> destination guides.
            </h3>
            <p className="text-white/40 mt-2 text-sm">Once a month. No spam. Unsubscribe any time.</p>
          </div>
          <div className="flex w-full lg:w-auto items-center gap-0 max-w-sm rounded-xl overflow-hidden"
            style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}>
            <div className="flex items-center gap-2 flex-1 px-4">
              <Mail className="h-4 w-4 text-white/30 flex-shrink-0" />
              <input
                type="email"
                placeholder="you@example.com"
                className="flex-1 h-12 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none min-w-0"
                aria-label="Email address"
              />
            </div>
            <button
              type="button"
              className="flex-shrink-0 h-12 px-5 text-sm font-bold text-ink-900 transition-all duration-200 hover:brightness-110 flex items-center gap-1.5"
              style={{ background: "linear-gradient(135deg,#F05A22,#E04A12)" }}
            >
              Subscribe <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </Container>
      </div>

      {/* ── Main grid ── */}
      <Container size="xl" className="relative py-14 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10 lg:gap-12">

          {/* Brand block */}
          <div className="col-span-2">
            {/* Logo */}
            <Link href="/" className="inline-flex items-center gap-3 mb-5 group">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt="WayTero"
                  width={140}
                  height={40}
                  className="h-10 w-auto object-contain brightness-0 invert"
                />
              ) : (
                <>
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: "linear-gradient(135deg,#1A56DB,#0B1B3B)", border: "1px solid rgba(26,86,219,0.4)" }}>
                    <span className="text-white font-black text-base">W</span>
                  </div>
                  <span className="text-[22px] font-black tracking-[-0.03em] text-white">
                    Way<span style={{ color: "#F05A22" }}>Tero</span>
                  </span>
                </>
              )}
            </Link>

            <p className="text-sm leading-relaxed mb-6 max-w-[260px]" style={{ color: "rgba(255,255,255,0.45)" }}>
              {description}
            </p>

            {/* App badges */}
            <div className="flex flex-col gap-2 mb-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.25)" }}>
                Get the App
              </p>
              <div className="flex gap-2">
                {[
                  { label: "App Store", sub: "Download on", href: iosLink },
                  { label: "Google Play", sub: "Get it on", href: androidLink },
                ].map((b) => (
                  <a
                    key={b.label}
                    href={b.href}
                    className="group inline-flex items-center gap-2 h-10 px-3.5 rounded-xl transition-all duration-300 ease-[var(--ease-wt)] hover:-translate-y-0.5"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                    aria-label={b.label}
                  >
                    <Smartphone className="h-4 w-4 text-white/60 group-hover:text-white transition-colors duration-300" />
                    <div className="leading-tight">
                      <div className="text-[9px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>{b.sub}</div>
                      <div className="text-xs font-semibold text-white">{b.label}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Social icons */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: "rgba(255,255,255,0.25)" }}>
                Follow us
              </p>
              <div className="flex items-center gap-2">
                {SOCIAL_META.map(({ icon: Icon, label, key }) => {
                  const href = socialMap[key] || `https://${key}.com/waytero`;
                  return (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="group relative h-8 w-8 inline-flex items-center justify-center rounded-lg transition-all duration-300 ease-[var(--ease-wt)] hover:-translate-y-0.5"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      <Icon className="h-3.5 w-3.5 text-white/40 group-hover:text-white transition-colors duration-300" />
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{
                          background: "linear-gradient(135deg, rgba(26,86,219,0.15) 0%, rgba(240,90,34,0.15) 100%)",
                          border: "1px solid rgba(26,86,219,0.3)",
                        }}
                      />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Link columns */}
          {footerColumns.map((col) => (
            <div key={col.title}>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] mb-4"
                style={{ color: "rgba(255,255,255,0.35)" }}>
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="group relative inline-flex items-center gap-1 text-sm transition-colors duration-300 ease-[var(--ease-wt)]"
                      style={{ color: "rgba(255,255,255,0.5)" }}
                    >
                      <span className="relative pb-0.5">
                        <span className="group-hover:text-white group-hover:translate-x-0.5 transition-all duration-300 ease-[var(--ease-wt)]">
                          {l.label}
                        </span>
                        <span
                          aria-hidden
                          className="pointer-events-none absolute left-0 -bottom-0.5 h-px w-0 bg-gradient-to-r from-primary-400 via-accent-400 to-accent-500 group-hover:w-full transition-all duration-500 ease-[var(--ease-wt)]"
                        />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>

      {/* ── Gradient divider ── */}
      <div className="h-px mx-8 lg:mx-16" style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)" }} />

      {/* ── Bottom bar ── */}
      <Container size="xl" className="py-6 flex flex-col-reverse lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#10B981" }} />
          <span>{copyright}</span>
          <span className="hidden sm:inline text-white/15">·</span>
          <span className="hidden sm:inline">Built in Bhubaneswar, Odisha</span>
        </div>
        <div className="flex items-center gap-4 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          <span className="inline-flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5" /> English (India)
          </span>
          <span className="text-white/15">·</span>
          <span>INR ₹</span>
          <span className="text-white/15">·</span>
          <Link
            href="/cookies"
            className="group relative inline-block transition-colors duration-300 ease-[var(--ease-wt)]"
          >
            <span className="group-hover:text-white/80 transition-colors duration-300">Cookies</span>
            <span
              aria-hidden
              className="pointer-events-none absolute left-0 -bottom-0.5 h-px w-0 bg-gradient-to-r from-primary-400 to-accent-500 group-hover:w-full transition-all duration-500 ease-[var(--ease-wt)]"
            />
          </Link>
          <span className="text-white/15">·</span>
          <Link
            href="/privacy"
            className="group relative inline-block transition-colors duration-300 ease-[var(--ease-wt)]"
          >
            <span className="group-hover:text-white/80 transition-colors duration-300">Privacy</span>
            <span
              aria-hidden
              className="pointer-events-none absolute left-0 -bottom-0.5 h-px w-0 bg-gradient-to-r from-primary-400 to-accent-500 group-hover:w-full transition-all duration-500 ease-[var(--ease-wt)]"
            />
          </Link>
        </div>
      </Container>
    </footer>
  );
}
