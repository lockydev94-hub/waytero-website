// ============================================================
// WAYTERO CUSTOMER — PROFILE & ADDRESS SERVICE
// Doc Ref: API Doc — Customer endpoints
//   GET  /customers/me                        → profile
//   PATCH /customers/me                       → update profile
//   PATCH /customers/me/mobile                → attach verified mobile
//   POST  /customers/me/addresses             → add address
//   PATCH /customers/me/addresses/{id}/default → set default
//   DELETE /customers/me/addresses/{id}       → delete address
// Auth is attached automatically by the apiClient interceptor.
// ============================================================
import apiClient from "@/lib/api";

export interface CustomerAddress {
  id: number;
  address_type?: string | null;
  address_line_1?: string | null;
  address_line_2?: string | null;
  city_id?: number | null;
  state_id?: number | null;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  is_default: boolean;
  created_at: string;
}

export interface CustomerProfile {
  id: number;
  uuid: string;
  customer_code: string;
  first_name?: string | null;
  last_name?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  city_id?: number | null;
  referral_code?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  addresses: CustomerAddress[];
  mobile_number?: string | null;
  email?: string | null;
}

export interface ProfileUpdateIn {
  first_name?: string;
  last_name?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  date_of_birth?: string;
  city_id?: number;
}

export interface AddressCreateIn {
  address_type?: "HOME" | "WORK" | "OTHER";
  address_line_1?: string;
  address_line_2?: string;
  city_id?: number;
  state_id?: number;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  is_default?: boolean;
}

const unwrap = <T,>(res: { data: T }): T => res.data;

export const customerProfileService = {
  getProfile: () => apiClient.get<CustomerProfile>("/customers/me").then(unwrap),

  updateProfile: (data: ProfileUpdateIn) =>
    apiClient.patch<CustomerProfile>("/customers/me", data).then(unwrap),

  updateMobile: (mobile_number: string) =>
    apiClient.patch<CustomerProfile>("/customers/me/mobile", { mobile_number }).then(unwrap),

  addAddress: (data: AddressCreateIn) =>
    apiClient.post<CustomerAddress>("/customers/me/addresses", data).then(unwrap),

  setDefaultAddress: (id: number) =>
    apiClient.patch<CustomerAddress>(`/customers/me/addresses/${id}/default`).then(unwrap),

  deleteAddress: (id: number) => apiClient.delete(`/customers/me/addresses/${id}`),
};

export default customerProfileService;