"use client";

/**
 * /login — Redirects to the home page and opens the auth modal.
 *
 * The customer-web app no longer has a dedicated login form. All sign-in
 * flows are handled by the site-wide SiteAuthModal (opened from the
 * header). This page is kept so that existing links (and the 401
 * fallback in src/lib/api.ts) still resolve to something sensible.
 */

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SiteAuthModal from "@/components/auth/SiteAuthModal";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") ?? "/";

  return (
    <>
      {/* Auth modal open on mount — covers the full screen */}
      <SiteAuthModal
        open
        onClose={() => router.replace(callbackUrl)}
        heading="Login or Sign Up"
        subheading="Sign in to manage your bookings, wallet, and trip preferences."
      />
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
