"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Menu, X, Phone, ChevronDown,
  Car, Building2, Compass, Navigation, IndianRupee,
  Info, Handshake, MessageCircle, UserCircle2, Users, Newspaper,
  LayoutDashboard, LogOut, ChevronUp, Wallet as WalletIcon, LifeBuoy, Bell, ShieldCheck,
} from "lucide-react";
import { Container } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadNotificationCount } from "@/hooks/useUnreadNotifications";
import { displayPhone, telHref } from "@/lib/supportPhone";
import { BRAND } from "@/lib/brand";
import SiteAuthModal from "@/components/auth/SiteAuthModal";
import chatService from "@/services/chatService";
import type { SiteHeaderData } from "@/types/cms";
import { isHiddenHref, type ServiceKey } from "@/lib/availability";

// ── Nav icon map ───────────────────────────────────────────────
const NAV_ICONS: Record<string, React.ReactNode> = {
  "/cabs":   <Car        className="h-[15px] w-[15px]" />,
  "/cabs/prices": <IndianRupee className="h-[15px] w-[15px]" />,
  "/hotels": <Building2  className="h-[15px] w-[15px]" />,
  "/tours":  <Compass    className="h-[15px] w-[15px]" />,
  "/track":  <Navigation className="h-[15px] w-[15px]" />,
};

const SECONDARY_ICONS: Record<string, React.ReactNode> = {
  "/about":   <Info          className="h-4 w-4" />,
  "/partner": <Handshake     className="h-4 w-4" />,
  "/contact": <MessageCircle className="h-4 w-4" />,
  "/blog":    <Newspaper     className="h-4 w-4" />,
};

const CAB_PRICES_LINK = { label: "Cab Prices", href: "/cabs/prices" };

const DEFAULT_NAV = [
  { label: "Cabs",   href: "/cabs" },
  CAB_PRICES_LINK,
  { label: "Hotels", href: "/hotels" },
  { label: "Tours",  href: "/tours" },
  { label: "Track",  href: "/track" },
];

const SECONDARY = [
  { label: "Travel Blog",     href: "/blog" },
  { label: "About",           href: "/about" },
  { label: "Become a Partner", href: "/partner" },
  { label: "Contact",         href: "/contact" },
];

// The signed-in pages. On a phone the avatar dropdown does not exist, so until
// now the drawer gave a customer no route at all to their own account.
const ACCOUNT_LINKS = [
  { label: "My Profile",    href: "/profile",       icon: <UserCircle2     className="h-[15px] w-[15px]" /> },
  { label: "My Bookings",   href: "/bookings",      icon: <LayoutDashboard className="h-[15px] w-[15px]" /> },
  { label: "My Wallet",     href: "/wallet",        icon: <WalletIcon      className="h-[15px] w-[15px]" /> },
  { label: "Notifications", href: "/notifications", icon: <Bell            className="h-[15px] w-[15px]" /> },
  { label: "Security",      href: "/account-security", icon: <ShieldCheck  className="h-[15px] w-[15px]" /> },
];

const DEFAULT_TAGLINE       = BRAND.tagline;
const DEFAULT_OFFICE_HOURS  = BRAND.officeHours;
const PARTNER_CTA           = { label: "Become a Partner", href: "/partner" };

interface Props {
  cmsData?: SiteHeaderData | null;
  /** True when the homepage hero has a background image/video (computed in
   *  the (site) server layout). The over-hero transparent header is only
   *  applied on the homepage itself — this component checks usePathname. */
  heroHasMedia?: boolean;
  /** Verticals hidden site-wide (disabled or no real supply) — computed
   *  server-side from GET /public/availability in the (site) layout. */
  hiddenServices?: ServiceKey[];
  /** Staffed hours from Settings → Platform. This strip used to print a
   *  hardcoded "24/7 support" next to the number the desk is only answered
   *  during the day — the layout resolves the real hours and passes them in,
   *  because this component is a client island and cannot fetch itself. */
  officeHours?: string;
  /** Ready-made wa.me link from Settings → Platform ("Desk hours & WhatsApp"),
   *  resolved server-side by lib/desk.ts and passed down by the (site) layout —
   *  same reason as officeHours: this is a client island. Empty hides the link. */
  whatsappHref?: string;
}

export default function Header({ cmsData, heroHasMedia = false, hiddenServices = [], officeHours = DEFAULT_OFFICE_HOURS, whatsappHref = "" }: Props) {
  const pathname            = usePathname() ?? "";
  const auth                = useAuth();
  const [open, setOpen]     = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [authOpen, setAuthOpen]       = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  // Is an agent actually signed in right now? null = unknown, and unknown
  // renders nothing — the bar never guesses at availability.
  const [deskOnline, setDeskOnline] = useState<boolean | null>(null);
  const moreRef    = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const isAuthed = !!auth.user;
  const { count: unread } = useUnreadNotificationCount();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // One-shot on mount: pull the freshest profile into the auth store so the
  // header shows the customer's real name even when the persisted session
  // predates a name edit (new OTP customers start as "Customer"). The
  // profile-completion flow already calls checkProfileCompletion, but a
  // returning session that was persisted before a name change won't have.
  useEffect(() => {
    const s = useAuth.getState();
    if (s.user && !s.hasCompleteProfile) {
      void s.checkProfileCompletion();
    }
  }, []);

  useEffect(() => {
    setOpen(false);
    setMoreOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  // A 401 with a dead session clears the tokens and dispatches this event
  // (see lib/api.ts clearSession). Open the auth modal so the customer can
  // re-login instead of being stuck in a zombie logged-in state where every
  // booking attempt silently 401s.
  useEffect(() => {
    const onAuthRequired = () => setAuthOpen(true);
    window.addEventListener("waytero:auth-required", onAuthRequired);
    return () => window.removeEventListener("waytero:auth-required", onAuthRequired);
  }, []);

  // One read of the desk's presence on mount (GET /chat/availability — a Redis
  // hash read, no DB). Deliberately not polled: the bar is decoration until the
  // customer opens the chat, and the widget itself re-checks while it is open.
  // Any failure leaves deskOnline null, so the label simply does not appear.
  useEffect(() => {
    let alive = true;
    chatService
      .availability()
      .then(({ support_online }) => {
        if (alive) setDeskOnline(support_online);
      })
      .catch(() => {
        /* offline backend, no network — say nothing rather than guess */
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close profile dropdown on Escape so keyboard users can dismiss it.
  useEffect(() => {
    if (!profileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setProfileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [profileOpen]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const rawCmsNav = (cmsData?.nav_links ?? []).filter((n) => n?.href && n?.label && !isHiddenHref(n.href, hiddenServices));
  // The price list is a page we ship, not a CMS band, so it is guaranteed a
  // place in the menu even when the admin's nav links replace the defaults —
  // added right after Cabs, where a fare list belongs.
  const baseNav = rawCmsNav.length > 0 ? rawCmsNav : DEFAULT_NAV;
  const withPrices = baseNav.some((n) => n.href === CAB_PRICES_LINK.href)
    ? baseNav
    : (() => {
        const i = baseNav.findIndex((n) => n.href === "/cabs");
        return i >= 0
          ? [...baseNav.slice(0, i + 1), CAB_PRICES_LINK, ...baseNav.slice(i + 1)]
          : [...baseNav, CAB_PRICES_LINK];
      })();
  const navLinks  = withPrices.filter((n) => !isHiddenHref(n.href, hiddenServices));
  const mobileLinks = [
    ...navLinks,
    ...SECONDARY.filter((s) => !navLinks.some((n) => n.href === s.href)),
  ];

  const logoUrl      = cmsData?.logo_url      ?? null;
  const logoAlt      = cmsData?.logo_alt_text ?? "WayTero";
  const tagline      = cmsData?.tagline       ?? DEFAULT_TAGLINE;
  // Phone: admin Settings → Platform Details overrides the CMS value
  // server-side (see backend build_public_homepage); displayPhone falls
  // back to the site-wide default when neither is set.
  const supportPhone = displayPhone(cmsData?.support_phone);
  const showLogin    = cmsData?.show_login_button ?? true;

  // Over-hero = transparent mode (when the homepage hero has a bg image/video
  // and the user hasn't scrolled yet). heroHasMedia comes from the server
  // layout; the pathname check keeps this homepage-only (the header renders on
  // every (site) page). usePathname is safe here — this is a client component.
  const overHeroUnscrolled = heroHasMedia && pathname === "/" && !scrolled;

  // ── Header bg ─────────────────────────────────────────────────────────────
  // Scrolled: solid white glass
  // Over hero: fully transparent (zero bg on the header bar itself)
  // No media: solid white
  const headerBg = scrolled
    ? "bg-white/97 backdrop-blur-xl shadow-[0_1px_0_0_rgba(229,231,235,0.8),0_8px_32px_rgba(11,27,59,0.08)]"
    : overHeroUnscrolled
      ? "bg-transparent"
      : "bg-white/95 backdrop-blur-md shadow-[0_1px_0_0_rgba(229,231,235,0.6)]";

  // Nav pill glass — only applied in over-hero mode; wraps just the nav links
  // Logo and CTAs remain clean / unaffected
  const navPillBg = overHeroUnscrolled
    ? "bg-black/55 backdrop-blur-xl border border-white/20 rounded-2xl px-2 py-1 shadow-[0_4px_32px_rgba(0,0,0,0.45)]"
    : "";

  // ── Color tokens ──────────────────────────────────────────────────────────
  // Nav text — full white + text-shadow when over hero so it punches through the image
  const navTextBase   = overHeroUnscrolled ? "text-white"       : "text-ink-3";
  const navTextHover  = overHeroUnscrolled ? "hover:text-white" : "hover:text-ink";
  const navTextActive = overHeroUnscrolled ? "text-white"       : "text-primary-600";

  const navActiveBg = overHeroUnscrolled
    ? "bg-white/20 border border-white/30 shadow-sm"
    : "bg-primary-50 border border-primary-100";

  const moreTextColor = overHeroUnscrolled
    ? "text-white hover:text-white"
    : "text-ink-3 hover:text-ink";

  const loginColor = overHeroUnscrolled
    ? "text-white border-white/30 hover:bg-white/15 hover:border-white/50"
    : "text-ink-3 border-ink-7 hover:text-primary-600 hover:border-primary-300";

  // Signed-in notification/profile chips sit on the hero photo with no bar
  // behind them, so plain white text disappeared whenever the image under it
  // was pale (white cars, sky). They get the same dark glass pill as the nav.
  const authChipColor = overHeroUnscrolled
    ? "border-white/25 bg-black/45 backdrop-blur-md text-white hover:bg-black/60 hover:border-white/50"
    : "border-ink-7 hover:border-primary-300 hover:bg-primary-50/40 text-ink-2";

  const logoTextColor   = overHeroUnscrolled ? "text-white"     : "text-ink";
  const logoAccentColor = overHeroUnscrolled ? "text-accent-400" : "text-primary-600";
  const logoSubColor    = overHeroUnscrolled ? "text-white/55"  : "text-ink-4";

  // Text shadow for nav items over hero photo
  // navTextShadow also carries the color when over-hero so it cannot be purged away
  const navTextShadow = overHeroUnscrolled
    ? { textShadow: "0 1px 8px rgba(0,0,0,0.95), 0 2px 16px rgba(0,0,0,0.70)", color: "#ffffff" }
    : {};

  // ── Auth surface (header right) ─────────────────────────────────
  // We mirror the useAuth store into the header so the customer sees
  // Login/Sign Up when signed out and a profile dropdown when signed in.
  // The dropdown is intentionally simple (bookings + logout); the deeper
  // profile pages live behind /bookings for now.
  const displayName = auth.user?.name || auth.user?.email || auth.user?.phone || "Member";
  // The customer asked for the avatar to show only the first letter of the
  // customer's name (a single initial). We still tolerate multi-word names
  // — split and pick the first non-empty token, take its first uppercase
  // char, and fall back to "W" (WayTero) when nothing usable is present.
  const firstToken =
    displayName.split(/\s+/).find((t) => t.length > 0) ?? "";
  const initials = (firstToken[0] ?? "W").toUpperCase();
  const avatarUrl = auth.user?.avatar;

  const handleLogout = () => {
    setProfileOpen(false);
    auth.logout();
  };

  const openAuthModal = () => setAuthOpen(true);

  return (
    <>
      {/* ══ Utility strip ═══════════════════════════════════════════════════
          Information bar, not a promo banner: solid footer-navy so the page
          gets dark bookends (this strip on top, the footer below), no gradient
          and no always-running shimmer. Plain block div — not sticky — so it
          sits above the sticky header and stays visible on every page.
          Every value here is admin-owned: SUPPORT_PHONE, the staffed hours
          (PLATFORM_OFFICE_HOURS, passed in as officeHours), the CMS tagline,
          PLATFORM_WHATSAPP_PHONE (whatsappHref) and the live agent presence
          from GET /chat/availability. Track and the partner page are NOT
          repeated here — the nav pill and the orange CTA below already own
          both destinations, so the strip stops competing with them.   */}
      <div className="bg-ink-900 border-b border-white/10">
        <Container size="xl" className="flex items-center justify-between gap-4 h-8 sm:h-9">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4 text-[11.5px] sm:text-xs font-medium">
            {deskOnline !== null && (
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-white/75">
                <span
                  aria-hidden
                  className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${
                    deskOnline ? "bg-accent-400" : "bg-white/35"
                  }`}
                />
                {deskOnline ? "Desk online" : "Desk offline"}
              </span>
            )}
            <a
              href={telHref(supportPhone)}
              className="hidden md:inline-flex items-center gap-1.5 text-white/75 hover:text-white transition-colors duration-200"
            >
              <Phone className="h-3 w-3 text-accent-400" aria-hidden />
              <span className="font-semibold">{supportPhone}</span>
            </a>
            <span className="hidden lg:inline whitespace-nowrap text-white/70">{officeHours}</span>
            <span className="hidden xl:inline truncate text-white/55">{tagline}</span>
          </div>
          <nav aria-label="Support shortcuts" className="hidden sm:flex items-center gap-4 text-xs">
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-white/70 hover:text-white transition-colors duration-200"
              >
                <MessageCircle className="h-3 w-3 text-accent-400" aria-hidden />
                WhatsApp
              </a>
            )}
            <Link
              href="/support"
              className="inline-flex items-center gap-1.5 text-white/70 hover:text-white transition-colors duration-200"
            >
              <LifeBuoy className="h-3 w-3 text-accent-400" aria-hidden />
              Help &amp; support
            </Link>
          </nav>
        </Container>
      </div>

      {/* ══ Main header ══════════════════════════════════════════════════════ */}
      <header className={`sticky top-0 z-40 transition-all duration-300 ease-out ${headerBg}`}>
        {/* Gradient accent underline when scrolled */}
        <div
          className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-accent-500 via-primary-600 to-accent-500 transition-all duration-700"
          style={{ width: scrolled ? "100%" : "0%", opacity: scrolled ? 1 : 0 }}
        />

        <Container size="xl" className="flex items-center justify-between h-16 lg:h-[68px] gap-4">

          {/* ── Logo + (below 1024px) the call chip, right of it ─────────── */}
          <div className="flex items-center gap-2 flex-shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group">
            {logoUrl ? (
              /* Logo image with border + shadow + glow */
              <div
                className="relative transition-all duration-300 group-hover:scale-[1.04]"
                style={{
                  padding: "3px",
                  borderRadius: "13px",
                  background: overHeroUnscrolled
                    ? "linear-gradient(135deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.08) 100%)"
                    : "linear-gradient(135deg, rgba(26,86,219,0.22) 0%, rgba(245,158,11,0.18) 100%)",
                  boxShadow: overHeroUnscrolled
                    ? "0 0 0 1px rgba(255,255,255,0.22), 0 4px 24px rgba(0,0,0,0.35), 0 0 20px rgba(255,255,255,0.10)"
                    : "0 0 0 1px rgba(26,86,219,0.14), 0 4px 18px rgba(26,86,219,0.20), 0 0 24px rgba(26,86,219,0.10)",
                }}
              >
                <Image
                  src={logoUrl}
                  alt={logoAlt}
                  width={160}
                  height={44}
                  /* h-11 = 44px — larger than before (was h-9 = 36px) */
                  className="h-14 w-auto object-contain relative z-10"
                  style={{ borderRadius: "10px" }}
                  priority
                />
              </div>
            ) : (
              /* Text fallback logo */
              <div className="flex items-center gap-2.5">
                <div className="relative h-10 w-10 flex-shrink-0">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary-500 to-primary-800 shadow-[0_4px_12px_rgba(26,86,219,0.4)] group-hover:shadow-[0_6px_20px_rgba(26,86,219,0.55)] transition-all duration-300 group-hover:scale-110" />
                  <span className="absolute inset-0 flex items-center justify-center text-white font-black text-base">W</span>
                </div>
                <div className="leading-none">
                  <div className={`text-[24px] font-black tracking-[-0.03em] transition-colors duration-300 ${logoTextColor}`}>
                    Way<span className={`transition-colors duration-300 ${logoAccentColor}`}>Tero</span>
                  </div>
                  <div className={`text-[9px] font-bold uppercase tracking-[0.22em] mt-0.5 transition-colors duration-300 ${logoSubColor}`}>
                    Travel OS
                  </div>
                </div>
              </div>
            )}
          </Link>

          {/* Tap-to-call beside the logo below 1024px — the floating call
              button is desktop-only, and this keeps one obvious call action
              on phones and tablets without eating nav width. */}
          <a
            href={telHref(supportPhone)}
            aria-label={`Call now — ${supportPhone}`}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-accent-600 text-white shadow-wt-accent transition-transform active:scale-95 lg:hidden"
          >
            <Phone size={16} />
          </a>
          </div>

          {/* ── Desktop nav — glass pill wraps ONLY the nav links ─────────── */}
          <nav className={`hidden lg:flex items-center gap-0.5 flex-1 justify-center ${navPillBg}`}>
            {navLinks.map((n, i) => {
              const icon   = NAV_ICONS[n.href] ?? null;
              const active = isActive(n.href);
              return (
                <Link
                  key={`nav-${i}-${n.href}`}
                  href={n.href}
                  style={navTextShadow}
                  className={`
                    group relative flex items-center gap-1.5 px-4 py-2 rounded-xl
                    text-[16px] font-semibold tracking-tight
                    transition-all duration-200
                    ${active
                      ? `${navTextActive} font-bold`
                      : `${navTextBase} ${navTextHover}`}
                  `}
                >
                  {/* Active bg pill */}
                  {active && (
                    <span className={`absolute inset-0 rounded-xl ${navActiveBg}`} />
                  )}
                  {/* Hover bg (non-active) */}
                  {!active && (
                    <span className={`
                      absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100
                      transition-opacity duration-200
                      ${overHeroUnscrolled ? "bg-white/20" : "bg-ink-9"}
                    `} />
                  )}
                  {/* Icon */}
                  {icon && (
                    <span className={`relative z-10 transition-colors duration-200 ${
                      active
                        ? overHeroUnscrolled ? "text-accent-400" : "text-primary-500"
                        : overHeroUnscrolled
                          ? "text-white/70 group-hover:text-accent-400"
                          : "text-ink-4 group-hover:text-primary-500"
                    }`}>
                      {icon}
                    </span>
                  )}
                  <span className="relative z-10">{n.label}</span>
                  {/* Active underline dot */}
                  {active && (
                    <span className={`
                      absolute -bottom-[9px] left-1/2 -translate-x-1/2 h-[3px] w-6 rounded-full
                      ${overHeroUnscrolled ? "bg-accent-400" : "bg-primary-500"}
                    `} />
                  )}
                </Link>
              );
            })}

            {/* More dropdown */}
            <div ref={moreRef} className="relative">
              <button
                onClick={() => setMoreOpen((v) => !v)}
                style={navTextShadow}
                className={`
                  group relative flex items-center gap-1 px-4 py-2 rounded-xl
                  text-[16px] font-semibold tracking-tight
                  transition-all duration-200 ${overHeroUnscrolled ? "" : moreTextColor}
                `}
              >
                <span className={`
                  absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100
                  transition-opacity duration-200
                  ${overHeroUnscrolled ? "bg-white/20" : "bg-ink-9"}
                `} />
                <span className="relative z-10 flex items-center gap-1">
                  More
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${moreOpen ? "rotate-180" : ""}`} />
                </span>
              </button>

              {moreOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-52 rounded-2xl bg-white border border-ink-7/60 shadow-[0_8px_32px_rgba(11,27,59,0.15)] overflow-visible z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Caret arrow */}
                  <div className="absolute -top-[5px] left-1/2 -translate-x-1/2 h-[10px] w-[10px] rotate-45 bg-white border-l border-t border-ink-7/60" />
                  <div className="py-1.5 overflow-hidden rounded-2xl">
                    {SECONDARY.map((s) => {
                      const icon = SECONDARY_ICONS[s.href];
                      return (
                        <Link
                          key={s.href}
                          href={s.href}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-ink-2 hover:bg-orange-50 hover:text-[#E04A12] transition-colors group/item"
                        >
                          <span className="text-ink-4 group-hover/item:text-[#F05A22] transition-colors">
                            {icon}
                          </span>
                          {s.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* ── Right: Login / Profile + Partner CTA ─────────────────────── */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            {showLogin && !isAuthed && (
              <button
                type="button"
                onClick={openAuthModal}
                className={`
                  inline-flex items-center gap-1.5 px-4 h-10 text-[13.5px] font-semibold rounded-xl
                  border transition-all duration-200 cursor-pointer
                  ${loginColor}
                `}
              >
                <UserCircle2 className="h-4 w-4" />
                Login / Sign Up
              </button>
            )}

            {showLogin && isAuthed && (
              <Link
                href="/notifications"
                aria-label={
                  unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
                }
                className={`
                  relative inline-flex h-10 w-10 items-center justify-center rounded-xl border
                  transition-all duration-200 cursor-pointer
                  ${authChipColor}
                `}
              >
                <Bell className="h-[18px] w-[18px]" />
                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold leading-none text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
            )}

            {showLogin && isAuthed && (
              <div ref={profileRef} className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((v) => !v)}
                  aria-label="Open profile menu"
                  aria-haspopup="menu"
                  aria-expanded={profileOpen}
                  className={`
                    inline-flex items-center gap-2 pl-1.5 pr-2 h-10 rounded-xl border
                    transition-all duration-200 cursor-pointer
                    ${authChipColor}
                  `}
                >
                  <span
                    className="h-7 w-7 rounded-lg inline-flex items-center justify-center text-[11px] font-extrabold text-white overflow-hidden flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #F05A22 0%, #E04A12 100%)" }}
                  >
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt={displayName}
                        width={28}
                        height={28}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </span>
                  <span
                    className="hidden lg:inline text-[13px] font-semibold max-w-[120px] truncate"
                    style={navTextShadow}
                  >
                    {displayName}
                  </span>
                  <ChevronUp
                    className={`h-4 w-4 transition-transform duration-200 ${profileOpen ? "" : "rotate-180"}`}
                  />
                </button>

                {profileOpen && (
                  <div
                    role="menu"
                    className={`absolute top-full right-0 mt-3 w-64 rounded-2xl border border-ink-7/60 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 ${
                      overHeroUnscrolled
                        ? "bg-white shadow-[0_8px_32px_rgba(0,0,0,0.45)]"
                        : "bg-white shadow-[0_8px_32px_rgba(11,27,59,0.18)]"
                    }`}
                  >
                    <div className="px-4 py-3 border-b border-ink-8">
                      <div className="text-sm font-extrabold text-ink truncate">{displayName}</div>
                      {(auth.user?.email || auth.user?.phone) && (
                        <div className="text-xs text-ink-4 truncate mt-0.5">
                          {auth.user.email ?? auth.user.phone}
                        </div>
                      )}
                    </div>
                    <div className="py-1.5">
                      <Link
                        href="/bookings"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-ink-2 hover:bg-orange-50 hover:text-[#E04A12] transition-colors"
                        role="menuitem"
                      >
                        <LayoutDashboard className="h-4 w-4 text-ink-4" />
                        My Bookings
                      </Link>
                      <Link
                        href="/wallet"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-ink-2 hover:bg-orange-50 hover:text-[#E04A12] transition-colors"
                        role="menuitem"
                      >
                        <WalletIcon className="h-4 w-4 text-ink-4" />
                        My Wallet
                      </Link>
                      <Link
                        href="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-ink-2 hover:bg-orange-50 hover:text-[#E04A12] transition-colors"
                        role="menuitem"
                      >
                        <UserCircle2 className="h-4 w-4 text-ink-4" />
                        My Profile
                      </Link>
                      <Link
                        href="/notifications"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-ink-2 hover:bg-orange-50 hover:text-[#E04A12] transition-colors"
                        role="menuitem"
                      >
                        <Bell className="h-4 w-4 text-ink-4" />
                        Notifications
                        {unread > 0 && (
                          <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-500 px-1.5 text-[10px] font-bold text-white">
                            {unread > 9 ? "9+" : unread}
                          </span>
                        )}
                      </Link>
                      <Link
                        href="/account-security"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-ink-2 hover:bg-orange-50 hover:text-[#E04A12] transition-colors"
                        role="menuitem"
                      >
                        <ShieldCheck className="h-4 w-4 text-ink-4" />
                        Account security
                      </Link>
                    </div>
                    <div className="border-t border-ink-8 py-1.5">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                        role="menuitem"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Orange partner CTA */}
            <Link
              href={PARTNER_CTA.href}
              className="group relative overflow-hidden inline-flex items-center gap-1.5 px-5 h-10 text-[13.5px] font-bold text-white rounded-xl transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #F05A22 0%, #E04A12 100%)",
                boxShadow: "0 4px 14px rgba(240,90,34,0.40)",
              }}
            >
              <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              <Users className="h-4 w-4 relative" />
              <span className="relative">{PARTNER_CTA.label}</span>
            </Link>
          </div>

          {/* ── Mobile hamburger ─────────────────────────────────────────── */}
          <button
            className={`lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
              overHeroUnscrolled
                ? "text-white hover:bg-white/15 border border-white/25"
                : "text-ink-2 hover:bg-ink-8 border border-transparent"
            }`}
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className={`absolute transition-all duration-200 ${open ? "opacity-100 rotate-0" : "opacity-0 rotate-90"}`}>
              <X className="h-5 w-5" />
            </span>
            <span className={`absolute transition-all duration-200 ${open ? "opacity-0 -rotate-90" : "opacity-100 rotate-0"}`}>
              <Menu className="h-5 w-5" />
            </span>
          </button>
        </Container>

        {/* ── Mobile drawer ──────────────────────────────────────────────────
            The hairline lives on the drawer itself, so it has to go when the
            drawer is closed: a collapsed (max-h-0) box still paints its top
            border, which added a stray 1px to the header height and pushed the
            full-bleed hero 1px out of register with the bar. */}
        <div
          className={`lg:hidden bg-white/98 backdrop-blur-xl overflow-hidden transition-all duration-300 ease-out ${
            open
              ? "max-h-[700px] opacity-100 border-t border-ink-7/60"
              : "max-h-0 opacity-0 border-t-0"
          }`}
        >
          <Container size="xl" className="py-3 space-y-0.5">
            {mobileLinks.map((n, i) => {
              const icon = NAV_ICONS[n.href] ?? SECONDARY_ICONS[n.href] ?? null;
              return (
                <Link
                  key={`mob-${i}-${n.href}`}
                  href={n.href}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    isActive(n.href)
                      ? "text-primary-600 bg-primary-50"
                      : "text-ink-2 hover:bg-orange-50 hover:text-[#E04A12]"
                  }`}
                >
                  <span className={isActive(n.href) ? "text-primary-400" : "text-ink-4"}>
                    {icon}
                  </span>
                  {n.label}
                </Link>
              );
            })}
            {showLogin && isAuthed && (
              <div className="mt-2 border-t border-ink-7/40 pt-2">
                <div className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-4">
                  Account
                </div>
                {/* Two columns, not four rows — the drawer already carries
                    eight nav links and a taller block would not fit a phone. */}
                <div className="grid grid-cols-2 gap-1.5 px-0.5">
                  {ACCOUNT_LINKS.map((n) => {
                    const badge = n.href === "/notifications" ? unread : 0;
                    return (
                      <Link
                        key={`acct-${n.href}`}
                        href={n.href}
                        className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150 ${
                          isActive(n.href)
                            ? "text-primary-600 bg-primary-50"
                            : "text-ink-2 hover:bg-orange-50 hover:text-[#E04A12]"
                        }`}
                      >
                        <span className={isActive(n.href) ? "text-primary-400" : "text-ink-4"}>
                          {n.icon}
                        </span>
                        <span className="truncate">{n.label.replace(/^My /, "")}</span>
                        {badge > 0 && (
                          <span className="ml-auto inline-flex h-5 min-w-5 flex-shrink-0 items-center justify-center rounded-full bg-accent-500 px-1.5 text-[10px] font-bold text-white">
                            {badge > 9 ? "9+" : badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="pt-3 pb-1 flex gap-2 border-t border-ink-7/40 mt-2">
              {showLogin && !isAuthed && (
                <button
                  type="button"
                  onClick={() => { setOpen(false); openAuthModal(); }}
                  className="flex-1 h-11 inline-flex items-center justify-center gap-1.5 rounded-xl border border-ink-7 text-ink-2 text-sm font-semibold hover:border-primary-300 hover:text-primary-600 transition-colors"
                >
                  <UserCircle2 className="h-4 w-4" />
                  Login / Sign Up
                </button>
              )}
              {showLogin && isAuthed && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex-1 h-11 inline-flex items-center justify-center gap-1.5 rounded-xl border border-ink-7 text-ink-2 text-sm font-semibold hover:border-red-300 hover:text-red-600 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              )}
              <Link
                href={PARTNER_CTA.href}
                className="flex-1 h-11 inline-flex items-center justify-center gap-1.5 rounded-xl text-white text-sm font-bold"
                style={{ background: "linear-gradient(135deg,#F05A22,#E04A12)", boxShadow: "0 4px 12px rgba(240,90,34,0.35)" }}
              >
                <Users className="h-4 w-4" />
                Partner
              </Link>
            </div>
          </Container>
        </div>
      </header>

      {/* Site-wide auth modal — triggered by the Login / Sign Up button. */}
      <SiteAuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        heading="Login or Sign Up"
        subheading="Sign in to manage your bookings, wallet, and trip preferences."
      />
    </>
  );
}
