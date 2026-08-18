// ============================================================
// WAYTERO — Public Leads Service (website forms)
// Doc Ref: Website Lead Capture §2 — Public API
// No auth required. Endpoints: /public/partner-applications,
// /public/contact-messages, /public/bookings/track.
// ============================================================

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export interface PartnerApplicationPayload {
  business_name: string;
  business_type: string;
  contact_person: string;
  mobile: string;
  email: string;
  city?: string;
  details?: string;
}

export interface ContactMessagePayload {
  name: string;
  email: string;
  mobile?: string;
  subject: string;
  message: string;
}

export interface TrackedBooking {
  service_type: "CAB" | "HOTEL";
  booking_number: string;
  master_booking_number: string;
  status: string;
  customer_name: string;
  trip?: {
    trip_type: string | null;
    pickup_location: string | null;
    drop_location: string | null;
    pickup_datetime: string | null;
    journey_start_date: string | null;
  };
  stay?: {
    hotel_name: string | null;
    hotel_address: string | null;
    check_in_date: string | null;
    check_out_date: string | null;
    num_rooms: number | null;
    num_guests: number | null;
  };
  driver?: {
    name: string | null;
    mobile: string | null;
    vehicle_number: string | null;
  } | null;
  amount: number;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

async function postJson<T>(path: string, payload: unknown): Promise<ApiEnvelope<T>> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as ApiEnvelope<T> & { detail?: string };
  if (!res.ok || !json.success) {
    throw new Error(json.detail || json.message || "Something went wrong. Please try again.");
  }
  return json;
}

export const publicLeadsService = {
  /** "Become a Partner" form → POST /public/partner-applications */
  submitPartnerApplication(payload: PartnerApplicationPayload) {
    return postJson<{ application_id: number }>("/public/partner-applications", payload);
  },

  /** "Send us a message" form → POST /public/contact-messages */
  submitContactMessage(payload: ContactMessagePayload) {
    return postJson<null>("/public/contact-messages", payload);
  },

  /** Booking tracker → GET /public/bookings/track?booking_number=&mobile= */
  async trackBooking(booking_number: string, mobile: string): Promise<ApiEnvelope<TrackedBooking>> {
    const params = new URLSearchParams({ booking_number, mobile });
    const res = await fetch(`${BASE_URL}/public/bookings/track?${params.toString()}`);
    const json = (await res.json()) as ApiEnvelope<TrackedBooking> & { detail?: string };
    if (!res.ok || !json.success) {
      throw new Error(
        json.detail || json.message || "Booking not found. Please check your details.",
      );
    }
    return json;
  },
};

export default publicLeadsService;
