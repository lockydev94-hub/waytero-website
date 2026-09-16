"use client";

// ============================================================
// WAYTERO — DYNAMIC SUPPORT PHONE (client hook)
//
// Client components can't receive the server-fetched phone as a prop
// when they're deep in the tree (blog post, contact form, track page),
// so this hook fetches GET /public/platform-profile once per mount.
// The response already carries SUPPORT_PHONE (Settings → Platform
// Details); falls back to the site-wide default when unset/unreachable.
// ============================================================

import { useEffect, useState } from "react";
import { FALLBACK_SUPPORT_PHONE } from "@/lib/supportPhone";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export function useSupportPhone(): string {
  const [phone, setPhone] = useState(FALLBACK_SUPPORT_PHONE);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/public/platform-profile`);
        if (!res.ok) return;
        const json = (await res.json()) as { support_phone?: string };
        const value = typeof json.support_phone === "string" ? json.support_phone.trim() : "";
        if (!cancelled && value) setPhone(value);
      } catch {
        /* keep fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return phone;
}
