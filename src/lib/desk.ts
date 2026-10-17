// ============================================================
// THE DESK — how a customer reaches a human, resolved once per request.
//
// Every contact point on the site used to hardcode its own literal, which is
// how "24/7 support" ended up in the header while the contact page said
// Mon–Sat. The admin now owns the hours and the WhatsApp number
// (system_configurations.PLATFORM_OFFICE_HOURS / PLATFORM_WHATSAPP_PHONE,
// surfaced by GET /public/platform-profile); this helper is the single place
// that reads them and applies the brand-master fallback.
//
// Server-only — it calls getPlatformProfile(), which fetches with `next`.
// ============================================================

import { cache } from "react";
import publicCmsService from "@/services/publicCms";
import { BRAND, waHref } from "./brand";
import { displayPhone, telHref } from "./supportPhone";

export interface Desk {
  /** Number shown in the UI. */
  phone: string;
  /** Ready-made `tel:` link for that number. */
  tel: string;
  /** Ready-made `wa.me` link. Falls back to the support number when the
   *  admin has not entered a WhatsApp line of its own. */
  whatsapp: string;
  email: string;
  address: string;
  /** Staffed hours as the admin wrote them, e.g. "Mon–Sat, 10:00 AM – 7:00 PM IST". */
  hours: string;
}

export const getDesk = cache(async (): Promise<Desk> => {
  const profile = await publicCmsService.getPlatformProfile();
  const phone = displayPhone(profile.support_phone);
  const whatsappNumber = profile.whatsapp_phone.trim() || phone;
  return {
    phone,
    tel: telHref(phone),
    whatsapp: waHref(whatsappNumber),
    email: profile.support_email || BRAND.email,
    address: profile.office_address,
    hours: profile.office_hours || BRAND.officeHours,
  };
});
