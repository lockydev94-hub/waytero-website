"use client";

/**
 * /register — Redirects to the home page and opens the auth modal.
 *
 * The customer-web app no longer has a dedicated register form. The
 * site-wide SiteAuthModal handles both login and sign-up. This page
 * is kept so existing links resolve to something sensible.
 */

import { useRouter } from "next/navigation";
import SiteAuthModal from "@/components/auth/SiteAuthModal";

export default function RegisterPage() {
  const router = useRouter();

  return (
    <SiteAuthModal
      open
      onClose={() => router.replace("/")}
      heading="Create your account"
      subheading="Sign in or sign up — your account is created automatically on first login."
    />
  );
}
