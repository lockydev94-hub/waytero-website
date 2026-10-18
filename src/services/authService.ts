// ============================================================
// WAYTERO CUSTOMER — AUTH SERVICE (account security)
// Doc Ref: API Doc — Auth (GET /auth/sessions, POST /auth/sessions/revoke,
//   POST /auth/change-password)
// Signing out of one device, or changing the password, both live server-side
// already; this is the client for them. Auth is attached by the apiClient
// interceptor.
// ============================================================
import apiClient from "@/lib/api";

export interface AuthSession {
  id: string;
  device_name: string | null;
  ip_address: string | null;
  user_agent: string | null;
  is_active: boolean;
  /**
   * Both timestamps are aliased to the same login_at column server-side, so
   * the UI shows one "Signed in" date rather than implying two different ones.
   */
  created_at: string;
  last_used_at: string;
  expires_at: string;
}

export interface MessageResponse {
  success: boolean;
  message: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  confirm_password: string;
  new_password: string;
}

const unwrap = <T,>(res: { data: T }): T => res.data;

export const authService = {
  listSessions: () =>
    apiClient
      .get<{ sessions: AuthSession[] }>("/auth/sessions")
      .then((res) => res.data.sessions),

  revokeSession: (sessionId: string) =>
    apiClient
      .post<MessageResponse>("/auth/sessions/revoke", { session_id: sessionId })
      .then(unwrap),

  /** Succeeds only to log the customer straight back out — the endpoint
   *  deactivates every session, this one included. A 401 here means "wrong
   *  current password", so it must not be handled as a dead session. */
  changePassword: (payload: ChangePasswordPayload) =>
    apiClient
      .post<MessageResponse>("/auth/change-password", payload, {
        _noSessionRefresh: true,
      })
      .then(unwrap),
};

export default authService;
