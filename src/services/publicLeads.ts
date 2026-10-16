// ============================================================
// WAYTERO — Public Leads Service (website forms)
// Doc Ref: Website Lead Capture §2 — Public API
// No auth required. Endpoints: /public/partner-applications,
// /public/contact-messages, /public/bookings/track, and the capture
// surfaces (/public/enquiries, /public/callback-requests,
// /public/bookings/feedback-lookup, /public/feedback).
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
  service_type: "CAB" | "HOTEL" | "TOUR" | "TRIP";
  booking_number: string;
  master_booking_number: string;
  status: string;
  customer_name: string;
  trip?: {
    trip_type?: string | null;
    pickup_location?: string | null;
    drop_location?: string | null;
    pickup_datetime?: string | null;
    journey_start_date?: string | null;
    service_types?: string;
    journey_end_date?: string | null;
  };
  stay?: {
    hotel_name: string | null;
    hotel_address: string | null;
    check_in_date: string | null;
    check_out_date: string | null;
    num_rooms: number | null;
    num_guests: number | null;
  };
  tour?: {
    package_name: string | null;
    destination: string | null;
    travel_start_date: string | null;
    travel_end_date: string | null;
    persons_count: number | null;
    duration_days: number | null;
    duration_nights: number | null;
  };
  driver?: {
    name: string | null;
    mobile: string | null;
    vehicle_number: string | null;
  } | null;
  amount: number;
}

export type CaptureServiceType = "CAB" | "HOTEL" | "TOUR" | "OTHER";

export interface EnquiryPayload {
  first_name: string;
  last_name?: string;
  email: string;
  mobile: string;
  service_type: CaptureServiceType;
  message: string;
}

/** Step 1 of the feedback page — everything is masked or first-name only. */
export interface FeedbackBooking {
  service_type: CaptureServiceType | "TRIP";
  booking_number: string;
  summary: string;
  customer_name: string;
  customer_mobile: string;
  journey_date: string | null;
  amount: number;
}

export interface FeedbackPayload {
  booking_number: string;
  mobile: string;
  rating: number;
  review?: string;
  guest_name: string;
  guest_email?: string;
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
  const json = (await res.json()) as ApiEnvelope<T> & { detail?: unknown };
  if (!res.ok || !json.success) {
    throw new Error(readError(json, res.status));
  }
  return json;
}

/**
 * The API answers with two shapes: our own envelope ({message}) for business
 * rules and rate limits, FastAPI's ({detail: [{msg}]}) for field validation.
 * A 429 says "slow down", which must not be reported as a form error.
 */
function readError(json: { message?: string; detail?: unknown }, status: number): string {
  if (status === 429) {
    return json.message || "Too many requests from this device. Please try again later.";
  }
  if (typeof json.detail === "string") return json.detail;
  if (Array.isArray(json.detail) && json.detail.length) {
    const first = json.detail[0] as { msg?: string; loc?: unknown[] };
    const field = Array.isArray(first.loc)
      ? String(first.loc[first.loc.length - 1] ?? "")
      : "";
    const label = field.replace(/_/g, " ");
    return label ? `Please check ${label}: ${first.msg ?? "invalid value"}` : "Please check the form and try again.";
  }
  return json.message || "Something went wrong. Please try again.";
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
    const json = (await res.json()) as ApiEnvelope<TrackedBooking> & { detail?: unknown };
    if (!res.ok || !json.success) {
      throw new Error(
        readError(json, res.status) ||
          "Booking not found. Please check your details.",
      );
    }
    return json;
  },

  /** "Enquiry Now" rail → POST /public/enquiries */
  submitEnquiry(payload: EnquiryPayload) {
    return postJson<{ enquiry_id: number }>("/public/enquiries", payload);
  },

  /** "Request a Callback" card → POST /public/callback-requests */
  requestCallback(payload: { mobile: string; name?: string }) {
    return postJson<{ callback_id: number }>("/public/callback-requests", payload);
  },

  /**
   * Feedback step 1 → GET /public/bookings/feedback-lookup.
   * A wrong reference and a wrong mobile return the same 404 body, so the
   * page shows one message for both and never confirms that a number exists.
   */
  async feedbackLookup(
    booking_number: string,
    mobile: string,
  ): Promise<ApiEnvelope<FeedbackBooking>> {
    const params = new URLSearchParams({ booking_number, mobile });
    const res = await fetch(
      `${BASE_URL}/public/bookings/feedback-lookup?${params.toString()}`,
    );
    const json = (await res.json()) as ApiEnvelope<FeedbackBooking> & {
      detail?: unknown;
    };
    if (!res.ok || !json.success) {
      throw new Error("We couldn't find that booking. Please check the details.");
    }
    return json;
  },

  /** Feedback step 2 → POST /public/feedback */
  submitFeedback(payload: FeedbackPayload) {
    return postJson<{ feedback_id: number }>("/public/feedback", payload);
  },
};

export default publicLeadsService;
