import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Providers from "@/components/Providers";
import { publicCmsService } from "@/services/publicCms";
import { displayPhone } from "@/lib/supportPhone";

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
    default: "WayTero — India's Travel Operating System",
    template: "%s | WayTero",
  },
  description:
    "Book cabs, hotels, and tour packages across India. WayTero connects customers, partners, drivers, and hotels on one seamless travel platform.",
  keywords: [
    "travel booking India",
    "cab booking",
    "hotel booking",
    "tour packages",
    "WayTero",
  ],
  authors: [{ name: "WayTero", url: "https://waytero.com" }],
  creator: "WayTero",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://waytero.com",
    siteName: "WayTero",
    title: "WayTero — India's Travel Operating System",
    description:
      "Book cabs, hotels, and tour packages across India on one seamless travel platform.",
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
    title: "WayTero — India's Travel Operating System",
    description: "Book cabs, hotels, and tour packages across India.",
    images: ["/og-image.png"],
    creator: "@waytero",
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

  // Admin-uploaded favicon (Cloudinary URL) wins over the bundled .ico.
  // The apple touch icon stays bundled — the admin upload flow is 32×32,
  // which is too small for the 180×180 apple-touch-icon slot.
  const icons = profile.favicon_url
    ? { icon: profile.favicon_url, shortcut: profile.favicon_url, apple: STATIC_ICONS.apple }
    : STATIC_ICONS;

  // Admin-uploaded OG image (1200×630) drives social shares site-wide;
  // the homepage and per-service pages inherit it unless they override.
  const ogImage = profile.og_image_url
    ? [{ url: profile.og_image_url, width: 1200, height: 630, alt: "WayTero — Travel OS" }]
    : BASE_METADATA.openGraph?.images;

  return {
    ...BASE_METADATA,
    icons,
    openGraph: {
      ...(BASE_METADATA.openGraph as object),
      images: ogImage,
    },
    twitter: {
      ...(BASE_METADATA.twitter as object),
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
    <html lang="en">
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
 * (Settings → Platform Details) as the Organization contact number.
 * Server component; the profile fetch is ISR-cached (5 min).
 */
async function RootJsonLd() {
  const profile = await publicCmsService.getPlatformProfile();
  const rawPhone = displayPhone(profile.support_phone);
  const telephone = rawPhone.startsWith("+")
    ? rawPhone
    : `+91-${rawPhone.replace(/\D/g, "")}`;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": "https://waytero.com/#organization",
              name: "WayTero",
              url: "https://waytero.com",
              logo: "https://res.cloudinary.com/jsrlg7ye/image/upload/v1787077754/waytero/platform/favicon_1787077753.png",
              telephone,
              sameAs: ["https://twitter.com/waytero"],
            },
            {
              "@type": "WebSite",
              "@id": "https://waytero.com/#website",
              url: "https://waytero.com",
              name: "WayTero",
              publisher: { "@id": "https://waytero.com/#organization" },
              inLanguage: "en-IN",
            },
          ],
        }),
      }}
    />
  );
}
