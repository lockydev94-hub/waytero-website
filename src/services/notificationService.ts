// ============================================================
// WAYTERO CUSTOMER — NOTIFICATION SERVICE
// Doc Ref: BRD Part 3 — customer notification inbox
//   GET  /notifications/me/notifications            → {items, unread_count}
//   GET  /notifications/me/notifications/unread-count
//   POST /notifications/me/notifications/{id}/read
//   POST /notifications/me/notifications/read-all
// Auth is attached automatically by the apiClient interceptor. These payloads
// are returned bare by the router (no {success,data} envelope), so unwrap()
// gives the body directly.
// ============================================================
import apiClient from "@/lib/api";

export interface NotificationRow {
  id: number;
  event_type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  /** Master booking id — present when the row can deep-link to /bookings. */
  booking_id: number | null;
  delivered_via: string;
  read_at: string | null;
  created_at: string;
}

export interface NotificationList {
  items: NotificationRow[];
  unread_count: number;
}

const unwrap = <T,>(res: { data: T }): T => res.data;

export const notificationService = {
  list: (params: { limit?: number; offset?: number; unread_only?: boolean } = {}) =>
    apiClient
      .get<NotificationList>("/notifications/me/notifications", { params })
      .then(unwrap),

  unreadCount: () =>
    apiClient
      .get<{ unread_count: number }>("/notifications/me/notifications/unread-count")
      .then(unwrap),

  markRead: (id: number) =>
    apiClient
      .post<{ success: boolean }>(`/notifications/me/notifications/${id}/read`)
      .then(unwrap),

  markAllRead: () =>
    apiClient
      .post<{ success: boolean; marked: number }>(
        "/notifications/me/notifications/read-all",
      )
      .then(unwrap),
};

export default notificationService;
