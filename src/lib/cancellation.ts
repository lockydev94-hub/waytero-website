// ============================================================
// WAYTERO CUSTOMER — CANCELLATION SERVICE
// Doc Ref: BRD Part 3 §46/§47, BRD Part 4 §82
// Customer self-cancel via the policy engine. The engine auto-computes
// the charge/refund and credits the wallet.
// ============================================================
import apiClient from "@/lib/api";

export type CancellationSource = "CUSTOMER" | "PARTNER_REQUEST" | "ADMIN" | "SYSTEM";

export interface CabRefundPreview {
  cab_booking_id: number;
  charge: number;
  refund_amount: number;
  refund_percent: number;
  tier_label: string;
  cab_total_amount: number;
  advance_paid_total: number;
  pickup_at: string | null;
  hours_to_pickup: number | null;
  is_post_assignment: boolean;
  policy_snapshot: Record<string, unknown>;
}

export interface HotelRefundPreview {
  hotel_reservation_id: number;
  charge: number;
  refund_amount: number;
  refund_percent: number;
  tier_label: string;
  hotel_total_amount: number;
  advance_paid_total: number;
  check_in_date: string | null;
  hours_to_checkin: number | null;
  policy_snapshot: Record<string, unknown>;
}

export interface TourRefundPreview {
  tour_booking_id: number;
  charge: number;
  refund_amount: number;
  refund_percent: number;
  tier_label: string;
  tour_total_amount: number;
  advance_paid_total: number;
  travel_start_date: string | null;
  days_to_travel: number | null;
  policy_snapshot: Record<string, unknown>;
}

export interface CustomerBookingSummary {
  id: number;
  booking_number: string;
  booking_status: string;
  payment_status: string;
  total_amount: number;
  total_paid_amount: number;
  services: string[];
  journey_start_date: string | null;
  journey_end_date: string | null;
  created_at: string;
}

export interface CustomerBookingDetail {
  id: number;
  booking_number: string;
  booking_status: string;
  payment_status: string;
  total_amount: number;
  total_paid_amount: number;
  total_refund_amount: number;
  journey_start_date: string | null;
  journey_end_date: string | null;
  remarks: string | null;
  created_at: string;
  cab_bookings: Array<{
    id: number;
    booking_number: string;
    trip_type: string | null;
    pickup_location: string | null;
    drop_location: string | null;
    pickup_datetime: string | null;
    /** Actual start stamp recorded by the partner when the trip began. */
    trip_started_at: string | null;
    trip_ended_at: string | null;
    actual_distance: number | null;
    booking_status: string;
    final_amount: number;
    estimated_amount: number;
    invoice_number: string | null;
    invoice_url: string | null;
    payment_mode: string | null;
    payment_collected_by: string | null;
    cash_amount_due: number | null;
    coupon_code: string | null;
    coupon_discount: number;
    gst_rate: number;
    gst_amount: number;
    is_tax_invoice: boolean;
    advance_payments: Array<{
      receipt_number: string;
      amount: number;
      payment_mode: string;
      received_by: string;
      collected_at: string | null;
    }>;
    advance_paid_total: number;
    balance_due: number;
  }>;
  hotel_bookings: Array<{
    id: number;
    reservation_number: string;
    reservation_status: string;
    hotel_name: string | null;
    hotel_address: string | null;
    room_category_name: string | null;
    room_type: string | null;
    nights: number;
    rooms_count: number;
    adults_count: number;
    /** Booked dates (what the customer reserved). */
    check_in_date: string | null;
    check_out_date: string | null;
    /** Actual stamps recorded by the property — authoritative after check-in. */
    actual_check_in_at: string | null;
    actual_check_out_at: string | null;
    check_in_at_local: string | null;
    check_out_at_local: string | null;
    platform_timezone: string | null;
    hotel_confirmation_number: string | null;
    invoice_number: string | null;
    invoice_url: string | null;
    invoice_generated_at: string | null;
    payment_collected_status: string;
    payment_collected_by: string | null;
    payment_mode: string | null;
    base_amount: number;
    extra_charges: number;
    discount_amount: number;
    coupon_code: string | null;
    coupon_discount: number;
    taxable_amount: number;
    gst_percent: number;
    gst_amount: number;
    is_tax_invoice: boolean;
    gst_enabled: boolean;
    total_amount: number;
    cancellation_charge: number;
    refund_amount: number;
    total_advance_paid: number;
    balance_due: number;
    advance_payments: Array<{
      receipt_number: string;
      amount: number;
      payment_mode: string;
      received_by: string;
      reference_number: string | null;
      collected_at: string | null;
    }>;
  }>;
  tour_bookings: Array<{
    id: number;
    booking_number: string;
    booking_status: string;
    payment_status: string;
    package_name: string | null;
    destination: string | null;
    duration_days: number;
    duration_nights: number;
    travel_start_date: string | null;
    travel_end_date: string | null;
    persons_count: number;
    pickup_location: string | null;
    pickup_datetime: string | null;
    hotel_details: string | null;
    other_details: string | null;
    special_requests: string | null;
    total_amount: number;
    platform_commission: number;
    partner_payout: number;
    additional_amount: number;
    additional_charge_note: string | null;
    advance_total: number;
    advance_received_by: string | null;
    invoice_number: string | null;
    invoiced_at: string | null;
    advance_payments: Array<{
      receipt_number: string;
      amount: number;
      payment_mode: string;
      received_by: string;
      reference_number: string | null;
      notes: string | null;
      collected_at: string | null;
    }>;
    charges: Array<{
      label: string;
      amount: number;
      reason: string | null;
      added_by_role: string;
      created_at: string | null;
    }>;
    itinerary_days: number;
    balance_due: number;
  }>;
}

export const customerCancellationService = {
  // Booking list + detail
  listBookings: () =>
    apiClient.get<CustomerBookingSummary[]>("/customers/me/bookings").then(r => r.data),
  getBooking: (bookingNumber: string) =>
    apiClient.get<CustomerBookingDetail>(`/customers/me/bookings/${bookingNumber}`).then(r => r.data),

  // Refund preview + cancel — single service
  previewCab: (cab_booking_number: string) =>
    apiClient.get<CabRefundPreview>(`/customers/me/cab-bookings/${cab_booking_number}/refund-preview`).then(r => r.data),
  cancelCab: (cab_booking_number: string, reason: string) =>
    apiClient.post(`/customers/me/cab-bookings/${cab_booking_number}/cancel`, { reason }).then(r => r.data),

  previewHotel: (reservation_number: string) =>
    apiClient.get<HotelRefundPreview>(`/customers/me/hotel-bookings/${reservation_number}/refund-preview`).then(r => r.data),
  cancelHotel: (reservation_number: string, reason: string) =>
    apiClient.post(`/customers/me/hotel-bookings/${reservation_number}/cancel`, { reason }).then(r => r.data),

  previewTour: (tour_booking_number: string) =>
    apiClient.get<TourRefundPreview>(`/customers/me/tour-bookings/${tour_booking_number}/refund-preview`).then(r => r.data),
  cancelTour: (tour_booking_number: string, reason: string) =>
    apiClient.post(`/customers/me/tour-bookings/${tour_booking_number}/cancel`, { reason }).then(r => r.data),

  // Invoice — streamed as a PDF blob for the browser download.
  downloadHotelInvoice: (reservation_number: string): Promise<Blob> =>
    apiClient
      .get(`/customers/me/hotel-bookings/${reservation_number}/download-invoice`, { responseType: "blob" })
      .then(r => r.data),
  downloadCabInvoice: (cab_booking_number: string): Promise<Blob> =>
    apiClient
      .get(`/customers/me/cab-bookings/${cab_booking_number}/download-invoice`, { responseType: "blob" })
      .then(r => r.data),
  downloadTourInvoice: (tour_booking_number: string): Promise<Blob> =>
    apiClient
      .get(`/customers/me/tour-bookings/${tour_booking_number}/download-invoice`, { responseType: "blob" })
      .then(r => r.data),
  downloadTourItinerary: (tour_booking_number: string): Promise<Blob> =>
    apiClient
      .get(`/customers/me/tour-bookings/${tour_booking_number}/download-itinerary`, { responseType: "blob" })
      .then(r => r.data),

  // Whole booking
  cancelBooking: (booking_number: string, reason: string) =>
    apiClient.post(`/customers/me/bookings/${booking_number}/cancel`, { reason }).then(r => r.data),
};
