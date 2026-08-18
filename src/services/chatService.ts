// ============================================================
// WAYTERO — Live Chat Service (customer website)
// Doc Ref: Website Chat §2 — Public API
// Endpoints: /chat/availability, /chat/conversations
//
// Uses the shared axios client (attaches the customer Bearer token
// when logged in). Guest requests pass guest_key in the body instead —
// the endpoints are public. Responses use the {success,message,data}
// envelope, so callers unwrap `data`.
// ============================================================
import apiClient from "@/lib/api";

export type ChatStatus = "WAITING" | "OPEN" | "CLOSED";
export type ChatSenderType = "CUSTOMER" | "ADMIN" | "SYSTEM";

export interface GuestIdentity {
  guest_key: string;
  name: string;
  email?: string;
  mobile?: string;
}

export interface ChatMessageItem {
  id: number;
  conversation_id: string;
  sender_type: ChatSenderType;
  sender_user_id: string | null;
  sender_name?: string | null;
  body: string;
  is_read: boolean;
  created_at: string;
}

export interface ChatConversationSummary {
  id: string;
  status: ChatStatus;
  subject: string | null;
  guest_name: string | null;
  assigned_admin_id: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_customer_count: number;
  unread_admin_count: number;
  created_at: string;
}

export interface StartChatPayload {
  subject?: string;
  message?: string;
  guest?: GuestIdentity;
}

export interface StartChatResult {
  conversation: ChatConversationSummary;
  support_online: boolean;
  is_new: boolean;
  first_message: ChatMessageItem | null;
}

export interface ConversationView {
  conversation: ChatConversationSummary;
  support_online: boolean;
  messages: ChatMessageItem[];
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export const chatService = {
  /** Is support online right now? — drives the widget's banner. */
  async availability(): Promise<{ support_online: boolean }> {
    const res = await apiClient.get<ApiEnvelope<{ support_online: boolean }>>("/chat/availability");
    return res.data.data;
  },

  /** Create or reopen the customer's conversation (smart routing). */
  async start(payload: StartChatPayload): Promise<StartChatResult> {
    const res = await apiClient.post<ApiEnvelope<StartChatResult>>("/chat/conversations", payload);
    return res.data.data;
  },

  /** Fetch conversation + messages. Guests pass guest_key. */
  async fetch(conversationId: string, guestKey?: string): Promise<ConversationView> {
    const res = await apiClient.get<ApiEnvelope<ConversationView>>(
      `/chat/conversations/${conversationId}`,
      { params: guestKey ? { guest_key: guestKey } : undefined },
    );
    return res.data.data;
  },

  /** Send a message as the customer. Guests pass guest_key. */
  async send(
    conversationId: string,
    body: string,
    guestKey?: string,
  ): Promise<{ message: ChatMessageItem }> {
    const res = await apiClient.post<ApiEnvelope<{ message: ChatMessageItem }>>(
      `/chat/conversations/${conversationId}/messages`,
      { body, guest_key: guestKey },
    );
    return res.data.data;
  },
};

export default chatService;