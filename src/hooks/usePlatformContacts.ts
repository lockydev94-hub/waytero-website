"use client";

// ============================================================
// WAYTERO — PLATFORM PROFILE (client hook)
//
// Client components that show contact/brand facts (contact page,
// partner page) fetch GET /public/platform-profile once per mount.
// The DB (system_configurations) is the source; empty/unreachable
// values fall back to the owner-approved brand master in lib/brand.
// ============================================================

import { useEffect, useState } from "react";
import { BRAND, BRAND_SOCIALS } from "@/lib/brand";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export interface PlatformContacts {
  phone: string;
  email: string;
  address: string;
  tagline: string;
  socials: Record<string, string>;
}

const FALLBACK: PlatformContacts = {
  phone: BRAND.phone,
  email: BRAND.email,
  address: BRAND.officeAddress,
  tagline: BRAND.tagline,
  socials: BRAND_SOCIALS,
};

export function usePlatformContacts(): PlatformContacts {
  const [contacts, setContacts] = useState<PlatformContacts>(FALLBACK);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/public/platform-profile`);
        if (!res.ok) return;
        const json = (await res.json()) as Record<string, unknown>;
        const str = (v: unknown): string =>
          typeof v === "string" && v.trim() ? v.trim() : "";
        const socials =
          json.social_links && typeof json.social_links === "object"
            ? (json.social_links as Record<string, string>)
            : {};
        if (cancelled) return;
        setContacts({
          phone: str(json.support_phone) || FALLBACK.phone,
          email: str(json.support_email) || FALLBACK.email,
          address: str(json.office_address) || FALLBACK.address,
          tagline: str(json.tagline) || FALLBACK.tagline,
          socials: Object.keys(socials).length ? socials : BRAND_SOCIALS,
        });
      } catch {
        /* keep brand-master fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return contacts;
}
