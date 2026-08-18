// ============================================================
// WAYTERO — ACCOUNT DELETION SERVICE (website)
//   POST /public/account-deletion-requests        — guest form
//   POST /customers/me/account-deletion-request   — logged-in
// Doc Ref: Account Deletion — Website Request Flow
// ============================================================
import apiClient from "@/lib/api";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export interface DeletionRequestPayload {
  full_name?: string;
  email?: string;
  mobile: string;
  reason: string;
}

export interface DeletionRequestResult {
  success: boolean;
  message: string;
  request_id: number;
  account_found?: boolean;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

/** Unauthenticated submit (public website form). */
async function postPublic(payload: DeletionRequestPayload): Promise<DeletionRequestResult> {
  const res = await fetch(`${BASE_URL}/public/account-deletion-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as DeletionRequestResult & { detail?: string };
  if (!res.ok || !json.success) {
    throw new Error(json.detail || json.message || "Something went wrong. Please try again.");
  }
  return json;
}

export const accountDeletionService = {
  /** Guest / generic form — only mobile + reason are required. */
  submitPublicRequest(payload: DeletionRequestPayload) {
    return postPublic(payload);
  },

  /** Logged-in customer — profile details are auto-attached server-side. */
  async submitLoggedInRequest(reason: string): Promise<DeletionRequestResult> {
    const res = await apiClient.post<DeletionRequestResult>("/customers/me/account-deletion-request", {
      reason,
    });
    const body = res.data;
    if (!body.success) {
      throw new Error(body.message || "Something went wrong. Please try again.");
    }
    return body;
  },
};

export default accountDeletionService;
