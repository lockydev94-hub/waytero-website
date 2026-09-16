// ============================================================
// WAYTERO — SUPPORT PHONE HELPERS
//
// The canonical contact number is saved by the admin under
// Settings → Platform Details (system_configurations.SUPPORT_PHONE)
// and exposed publicly via GET /public/platform-profile. Everywhere on
// the customer website must use the dynamic number; the fallback below
// is only used when the admin hasn't configured one (or the API is
// unreachable), so a phone entry point always exists.
// ============================================================

/** Fallback contact number shown when no admin-configured number exists. */
export const FALLBACK_SUPPORT_PHONE = "8480889870";

/** Digits-only view of a number for `tel:` links (keeps a leading +). */
export function telHref(raw: string | null | undefined): string {
  const value = (raw ?? "").trim() || FALLBACK_SUPPORT_PHONE;
  const plus = value.startsWith("+");
  const digits = value.replace(/\D/g, "");
  if (!digits) return `tel:+91${FALLBACK_SUPPORT_PHONE}`;
  // Bare 10-digit Indian mobile → add the +91 country code for tel:.
  if (!plus && digits.length === 10) return `tel:+91${digits}`;
  return `tel:${plus ? "+" : ""}${digits}`;
}

/** Number to show in the UI — admin-saved value, else the fallback. */
export function displayPhone(raw: string | null | undefined): string {
  const value = (raw ?? "").trim();
  return value || FALLBACK_SUPPORT_PHONE;
}
