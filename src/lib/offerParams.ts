/**
 * Offer ride-through plumbing.
 *
 * /offers/{slug} CTAs link to booking surfaces with ?offer=<slug>&coupon=<code>
 * &offer_name=<title>. Search forms rebuild the query string from scratch on
 * every submit, so without this the offer context would vanish on the first
 * re-search. Purely additive: existing keys are never overwritten, and the
 * values are display/hint only — the server re-validates the coupon and
 * resolves the offer at booking creation.
 */

const OFFER_KEYS = ["offer", "coupon", "offer_name"] as const;

/** Copy any offer context present on the current URL into `params`. */
export function carryOfferContext(params: URLSearchParams): void {
  if (typeof window === "undefined") return;
  const current = new URLSearchParams(window.location.search);
  for (const key of OFFER_KEYS) {
    const value = current.get(key);
    if (value && !params.has(key)) params.set(key, value);
  }
}
