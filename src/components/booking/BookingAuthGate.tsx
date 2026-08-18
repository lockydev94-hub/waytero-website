"use client";

/**
 * BookingAuthGate — auth modal shown before a cab booking is created.
 *
 * This is a thin wrapper around SiteAuthModal so the booking flow shares
 * the single canonical auth UI. Auth state is read from the global
 * `useAuth()` zustand store, so a successful sign-in here also flips the
 * site header to the profile icon on next render — no special casing.
 */

import SiteAuthModal, { type SiteAuthModalProps } from "@/components/auth/SiteAuthModal";

export type BookingAuthResult = {
  token: string;
  mode: "EMAIL" | "MOBILE";
  mobile?: string;
  email?: string;
};

interface BookingAuthGateProps {
  open: boolean;
  onClose: () => void;
  /** Receives the freshly issued token + mode so the caller can immediately
   *  proceed with the booking using the access token it hand-back. Kept for
   *  API compatibility with existing callers; the header also sees the same
   *  state because we read it from the global auth store. */
  onAuthenticated: (result: BookingAuthResult) => void;
  heading?: string;
  subheading?: string;
}

export default function BookingAuthGate({
  open,
  onClose,
  onAuthenticated,
  heading,
  subheading,
}: BookingAuthGateProps) {
  const handleAuthenticated: NonNullable<SiteAuthModalProps["onAuthenticated"]> = () => {
    const token =
      typeof window === "undefined"
        ? ""
        : (localStorage.getItem("wt_customer_access") ?? "");
    onAuthenticated({ token, mode: "MOBILE" });
  };

  return (
    <SiteAuthModal
      open={open}
      onClose={onClose}
      heading={heading}
      subheading={subheading}
      onAuthenticated={handleAuthenticated}
    />
  );
}
