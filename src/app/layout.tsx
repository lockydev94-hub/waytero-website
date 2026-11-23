import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { publicCmsService } from "@/services/publicCms";
import { displayPhone } from "@/lib/supportPhone";
import { getLandingRefs } from "@/lib/landingIndex";
import { absoluteImage, appUrl } from "@/services/seoService";
import { BRAND } from "@/lib/brand";

// Self-hosted at build time — no render-blocking request to fonts.gstatic.com,
// which is a Core Web Vitals (LCP/CLS) cost Google measures.
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// Display face for headlines (the homepage hero, section titles). Jakarta's
// geometric-humanist letterforms match the shared design's headings; body
// copy stays on Inter. Both are self-hosted at build time.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["600", "700", "800"],
  variable: "--font-jakarta",
});

// ── Global SEO defaults (overridden per page) ────────────────────────────────
// Static base metadata — favicon + OG image are filled in at request time by
// generateMetadata() from the backend platform profile (Settings → Platform
// Profile uploads), falling back to the bundled files below when the admin
// hasn't uploaded anything or the API is unreachable.
const BASE_METADATA: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://waytero.com"
  ),
  title: {
    default: `WayTero — ${BRAND.tagline}`,
    template: "%s | WayTero",
  },
  description:
    "Book cabs, hotels and Odisha tour packages in Bhubaneswar with upfront fares and verified drivers. One platform for customers, partners, drivers and hotels.",
  keywords: [
    "cab booking Bhubaneswar",
    "Bhubaneswar taxi",
    "Odisha tour packages",
    "hotels in Bhubaneswar",
    "WayTero",
  ],
  authors: [{ name: "WayTero", url: appUrl() }],
  creator: "WayTero",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: appUrl(),
    siteName: "WayTero",
    title: `WayTero — ${BRAND.tagline}`,
    description:
      "Book cabs, hotels and Odisha tour packages in Bhubaneswar with upfront fares and verified drivers.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "WayTero — Travel OS",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `WayTero — ${BRAND.tagline}`,
    description: "Book cabs, hotels and Odisha tour packages in Bhubaneswar.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const STATIC_ICONS = {
  icon: "/favicon.ico",
  shortcut: "/favicon-16x16.png",
  apple: "/apple-touch-icon.png",
};

export async function generateMetadata(): Promise<Metadata> {
  const profile = await publicCmsService.getPlatformProfile();

  // Admin-uploaded favicon (Cloudinary URL) wins over the bundled .ico. The
  // upload slot crops to 96×96: Google refuses to show a site icon in search
  // results below 48×48, and 96 is a multiple of 48 (it also downsamples
  // cleanly for the 16/32px browser tab). The apple touch icon stays bundled
  // — 96 is still short of the 180×180 that iOS wants.
  const icons = profile.favicon_url
    ? {
        icon: [{ url: profile.favicon_url, sizes: "96x96", type: "image/png" }],
        shortcut: profile.favicon_url,
        apple: STATIC_ICONS.apple,
      }
    : STATIC_ICONS;

  // Admin-uploaded OG image (1200×630) drives social shares site-wide;
  // the homepage and per-service pages inherit it unless they override.
  const ogImage = profile.og_image_url
    ? [{ url: profile.og_image_url, width: 1200, height: 630, alt: "WayTero — Travel OS" }]
    : BASE_METADATA.openGraph?.images;

  return {
    ...BASE_METADATA,
    title: { default: `WayTero — ${profile.tagline}`, template: "%s | WayTero" },
    icons,
    openGraph: {
      ...(BASE_METADATA.openGraph as object),
      title: `WayTero — ${profile.tagline}`,
      images: ogImage,
    },
    twitter: {
      ...(BASE_METADATA.twitter as object),
      title: `WayTero — ${profile.tagline}`,
      images: profile.og_image_url ? [profile.og_image_url] : BASE_METADATA.twitter?.images,
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1A56DB",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="relative">
        <div aria-hidden className="pointer-events-none fixed inset-0 z-[1] bg-noise opacity-[0.4] mix-blend-overlay" />
        <RootJsonLd />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

/**
 * Organization + WebSite JSON-LD with the admin-configured support phone
 * (Settings → Platform Details) as the Organization contact number, the
 * admin-uploaded logo (Settings → Platform Profile) as the ImageObject logo,
 * and areaServed derived from the published landing pages' cities/states.
 * Server component; both fetches are ISR-cached (5 min).
 */
async function RootJsonLd() {
  const [profile, refs] = await Promise.all([
    publicCmsService.getPlatformProfile(),
    getLandingRefs(),
  ]);
  const rawPhone = displayPhone(profile.support_phone);
  const telephone = rawPhone.startsWith("+")
    ? rawPhone
    : `+91-${rawPhone.replace(/\D/g, "")}`;

  const root = appUrl();
  const seen = new Set<string>();
  // Place pages are airports/stations, not cities. Labelling them as City was
  // a factual schema error; keep them as Place and let the place page itself
  // describe the Airport/TrainStation subtype.
  const areaServed = refs
    .map((r) => ({
      "@type":
        r.scope.kind === "state"
          ? "State"
          : r.scope.kind === "city"
            ? "City"
            : "Place",
      name: r.scope.display_name,
    }))
    .filter((a) => !seen.has(a.name) && seen.add(a.name));
  const sameAs = Object.values(profile.social_links).filter(Boolean);
  const officeAddress = profile.office_address || BRAND.officeAddress;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": ["Organization", "TravelAgency"],
              "@id": `${root}/#organization`,
              name: "WayTero",
              alternateName: "WayTero Travel",
              url: root,
              ...(profile.logo_url
                ? { logo: { "@type": "ImageObject", url: absoluteImage(profile.logo_url) } }
                : {}),
              image: absoluteImage(profile.og_image_url),
              description:
                "Travel platform for cab booking in Bhubaneswar, hotels and curated Odisha tour packages.",
              telephone,
              email: profile.support_email || BRAND.email,
              address: {
                "@type": "PostalAddress",
                streetAddress: officeAddress,
                addressCountry: "IN",
              },
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer support",
                telephone,
                email: profile.support_email || BRAND.email,
                areaServed: "IN",
                availableLanguage: "en",
              },
              ...(areaServed.length ? { areaServed } : {}),
              ...(sameAs.length ? { sameAs } : {}),
            },
            {
              "@type": "WebSite",
              "@id": `${root}/#website`,
              url: root,
              name: "WayTero",
              publisher: { "@id": `${root}/#organization` },
              inLanguage: "en-IN",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${root}/cabs/routes?q={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
            },
          ],
        })
          .replace(/</g, "\\u003c")
          .replace(/>/g, "\\u003e"),
      }}
    />
  );
}
