"use client";

// ============================================================
// WAYTERO CUSTOMER — UNREAD NOTIFICATION COUNT
//
// One query shared by the header bell and the account tabs so the count cannot
// disagree between them. Marking something read invalidates this key, which is
// why the header badge follows for free.
//
// The 60s poll is deliberate: dispatch pushes under the *event-type* name
// (BOOKING_CONFIRMED, …), so there is no single generic "notification" event
// a client can subscribe to. Polling is the guaranteed path.
// ============================================================

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { notificationService } from "@/services/notificationService";

export const NOTIFICATIONS_UNREAD_KEY = ["notifications-unread"];
export const NOTIFICATIONS_LIST_KEY = ["customer-notifications"];

export function useUnreadNotificationCount() {
  const isAuthed = useAuth((s) => !!s.user);
  const query = useQuery({
    queryKey: NOTIFICATIONS_UNREAD_KEY,
    queryFn: () => notificationService.unreadCount(),
    enabled: isAuthed,
    staleTime: 30_000,
    retry: 1,
    refetchInterval: 60_000,
    // Global default is false; the bell should be current when the tab comes
    // back rather than up to a minute stale.
    refetchOnWindowFocus: true,
  });
  return { count: query.data?.unread_count ?? 0, isAuthed };
}
