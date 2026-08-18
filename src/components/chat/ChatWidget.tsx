// ============================================================
// WAYTERO CUSTOMER — LIVE CHAT WIDGET
// Doc Ref: Website Chat §2/§3 — Public API + smart routing
//
// Floating support widget on every (site) page. Smart routing: it asks
// the backend whether support is online before starting a chat and shows
// an online/offline banner accordingly. Logged-in customers chat as
// themselves over WebSocket; guests give a name + mobile (optional) and
// use a persisted guest_key so they can come back to the same thread.
// ============================================================

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MessageCircle, X, Send, Headset, User, Phone, Mail, Clock, Wifi, WifiOff,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useChatRealtime } from "@/hooks/useChatRealtime";
import chatService, {
  type ChatMessageItem,
  type ChatStatus,
} from "@/services/chatService";

const TOPICS = [
  "Booking help",
  "Cab booking",
  "Hotel booking",
  "Payment & refund",
  "Wallet",
  "Other",
];

const GUEST_KEY_LS = "wt_chat_guest_key";
const GUEST_NAME_LS = "wt_chat_guest_name";
const GUEST_MOBILE_LS = "wt_chat_guest_mobile";
const CONV_LS = "wt_chat_conversation";

function getOrCreateGuestKey(): string {
  if (typeof window === "undefined") return "";
  const existing = localStorage.getItem(GUEST_KEY_LS);
  if (existing) return existing;
  const key =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(GUEST_KEY_LS, key);
  return key;
}

function timeLabel(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

type View = "welcome" | "identity" | "thread";

export default function ChatWidget() {
  const { user, accessToken } = useAuth();
  const isLoggedIn = Boolean(accessToken && user);

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("welcome");
  const [supportOnline, setSupportOnline] = useState<boolean | null>(null);
  const [subject, setSubject] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [status, setStatus] = useState<ChatStatus | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState(false);

  const [guestName, setGuestName] = useState("");
  const [guestMobile, setGuestMobile] = useState("");
  const [guestEmail, setGuestEmail] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesRef = useRef<ChatMessageItem[]>([]);
  messagesRef.current = messages;

  // Realtime for logged-in customers; guests poll instead.
  const { subscribe } = useChatRealtime(isLoggedIn ? accessToken : null);

  const refresh = useCallback(async () => {
    if (!conversationId) return;
    try {
      const viewData = await chatService.fetch(
        conversationId,
        isLoggedIn ? undefined : getOrCreateGuestKey(),
      );
      setStatus(viewData.conversation.status);
      setSupportOnline(viewData.support_online);
      setMessages(viewData.messages);
    } catch {
      /* transient — keep last state */
    }
  }, [conversationId, isLoggedIn]);

  // Poll fallback (works for guests + any tab) + WS for logged-in users.
  useEffect(() => {
    if (!open || !conversationId) return;
    const poll = window.setInterval(() => void refresh(), 4_000);
    return () => window.clearInterval(poll);
  }, [open, conversationId, refresh]);

  // Keep the online/offline banner honest while the widget is open — an
  // admin can log in at any moment and the widget should reflect it.
  useEffect(() => {
    if (!open) return;
    const poll = window.setInterval(async () => {
      try {
        const { support_online } = await chatService.availability();
        setSupportOnline(support_online);
      } catch {
        /* keep last state */
      }
    }, 15_000);
    return () => window.clearInterval(poll);
  }, [open]);

  useEffect(() => {
    const off = subscribe("chat.message", (msg) => {
      const data = msg.data as unknown as { conversation_id?: string; id?: number };
      if (!data?.conversation_id || data.conversation_id !== conversationId) return;
      if (messagesRef.current.some((m) => m.id === data.id)) return;
      void refresh();
    });
    return off;
  }, [subscribe, conversationId, refresh]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, view]);

  const openWidget = async () => {
    setOpen(true);
    // Resume an existing thread if there is one.
    const saved = typeof window !== "undefined" ? localStorage.getItem(CONV_LS) : null;
    if (saved) {
      setConversationId(saved);
      setView("thread");
      void refresh();
      return;
    }
    // Prefill guest identity from memory.
    if (typeof window !== "undefined") {
      setGuestName(localStorage.getItem(GUEST_NAME_LS) ?? "");
      setGuestMobile(localStorage.getItem(GUEST_MOBILE_LS) ?? "");
    }
    try {
      const { support_online } = await chatService.availability();
      setSupportOnline(support_online);
    } catch {
      setSupportOnline(true);
    }
    setView(isLoggedIn ? "welcome" : "welcome");
  };

  const startConversation = async (chosenSubject: string, firstMessage?: string) => {
    setBusy(true);
    try {
      const result = await chatService.start({
        subject: chosenSubject,
        message: firstMessage?.trim() || undefined,
        ...(isLoggedIn
          ? {}
          : {
              guest: {
                guest_key: getOrCreateGuestKey(),
                name: guestName.trim() || "Guest",
                mobile: guestMobile.trim() || undefined,
                email: guestEmail.trim() || undefined,
              },
            }),
      });
      if (!isLoggedIn) {
        localStorage.setItem(GUEST_NAME_LS, guestName.trim());
        localStorage.setItem(GUEST_MOBILE_LS, guestMobile.trim());
      }
      localStorage.setItem(CONV_LS, result.conversation.id);
      setConversationId(result.conversation.id);
      setSubject(result.conversation.subject ?? chosenSubject);
      setStatus(result.conversation.status);
      setSupportOnline(result.support_online);
      setMessages(result.first_message ? [result.first_message] : []);
      setView("thread");
    } catch {
      setBusy(false);
    } finally {
      setBusy(false);
    }
  };

  const pickTopic = (topic: string) => {
    setSubject(topic);
    if (isLoggedIn) {
      void startConversation(topic);
    } else {
      setView("identity");
    }
  };

  const submitGuestForm = () => {
    if (!guestName.trim()) return;
    void startConversation(subject ?? "Other");
  };

  const sendMessage = async () => {
    if (!conversationId || !draft.trim() || sending) return;
    setSending(true);
    try {
      const res = await chatService.send(
        conversationId,
        draft.trim(),
        isLoggedIn ? undefined : getOrCreateGuestKey(),
      );
      setDraft("");
      setMessages((prev) => (prev.some((m) => m.id === res.message.id) ? prev : [...prev, res.message]));
    } catch {
      /* keep draft so the user can retry */
    } finally {
      setSending(false);
    }
  };

  const resetWidget = () => {
    setOpen(false);
    setView("welcome");
    setConversationId(null);
    setSubject(null);
    setStatus(null);
    setMessages([]);
    if (typeof window !== "undefined") localStorage.removeItem(CONV_LS);
  };

  return (
    <>
      {/* Launcher */}
      <button
        onClick={() => (open ? setOpen(false) : void openWidget())}
        aria-label={open ? "Close chat" : "Chat with support"}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-teal-500 text-white shadow-lg shadow-blue-600/30 transition-transform hover:scale-105"
      >
        {open ? <X size={24} /> : <MessageCircle size={26} />}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-teal-500 px-4 py-3 text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
              <Headset size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold leading-tight">WayTero Support</p>
              <p className="flex items-center gap-1 text-xs opacity-90">
                {supportOnline === false ? (
                  <>
                    <WifiOff size={12} /> We're offline right now
                  </>
                ) : supportOnline === true ? (
                  <>
                    <Wifi size={12} /> We're online — reply within minutes
                  </>
                ) : (
                  <>
                    <Clock size={12} /> Checking availability…
                  </>
                )}
              </p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Minimize" className="text-white/80 hover:text-white">
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex max-h-[420px] min-h-[320px] flex-col overflow-y-auto bg-gray-50">
            {view === "welcome" && (
              <div className="p-4">
                <p className="mb-3 text-sm text-gray-600">
                  Hi! What would you like to talk about? Our team will jump in right away.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {TOPICS.map((t) => (
                    <button
                      key={t}
                      onClick={() => pickTopic(t)}
                      className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-left text-xs font-semibold text-gray-700 transition-colors hover:border-blue-500 hover:text-blue-600"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {view === "identity" && (
              <div className="p-4">
                <p className="mb-3 text-sm font-semibold text-gray-700">
                  Tell us who you are so we can help better
                </p>
                <div className="space-y-2.5">
                  <label className="block">
                    <span className="mb-1 flex items-center gap-1 text-xs font-medium text-gray-600">
                      <User size={13} /> Name <span className="text-red-500">*</span>
                    </span>
                    <input
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Your name"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 flex items-center gap-1 text-xs font-medium text-gray-600">
                      <Phone size={13} /> Mobile <span className="text-gray-400">(optional)</span>
                    </span>
                    <input
                      value={guestMobile}
                      onChange={(e) => setGuestMobile(e.target.value)}
                      placeholder="10-digit mobile"
                      inputMode="tel"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 flex items-center gap-1 text-xs font-medium text-gray-600">
                      <Mail size={13} /> Email <span className="text-gray-400">(optional)</span>
                    </span>
                    <input
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="you@example.com"
                      type="email"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                  </label>
                  <button
                    onClick={submitGuestForm}
                    disabled={!guestName.trim() || busy}
                    className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                  >
                    {busy ? "Starting…" : "Start chat"}
                  </button>
                </div>
              </div>
            )}

            {view === "thread" && (
              <div className="flex flex-col flex-1">
                {status === "WAITING" && (
                  <div className="m-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    We're offline right now — your messages are saved and our team will reply as soon as possible.
                  </div>
                )}
                <div className="flex flex-1 flex-col gap-2 p-3">
                  {messages.length === 0 ? (
                    <p className="py-6 text-center text-xs text-gray-400">
                      {subject ? `Start by telling us about "${subject}"` : "Say hi!"}
                    </p>
                  ) : (
                    messages.map((m) => {
                      const mine = m.sender_type === "CUSTOMER";
                      return (
                        <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                          <p className={`mb-0.5 px-1 text-[10px] font-semibold ${mine ? "text-blue-700" : "text-gray-500"}`}>
                            {mine ? "You" : m.sender_name || "WayTero Support"}
                          </p>
                          <div
                            className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                              mine
                                ? "rounded-br-sm bg-blue-600 text-white"
                                : "rounded-bl-sm border border-gray-200 bg-white text-gray-800"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{m.body}</p>
                            <p className={`mt-0.5 text-right text-[10px] ${mine ? "text-blue-100" : "text-gray-400"}`}>
                              {timeLabel(m.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="flex items-center gap-2 border-t border-gray-200 bg-white p-3">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void sendMessage();
                      }
                    }}
                    placeholder="Type a message…"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => void sendMessage()}
                    disabled={!draft.trim() || sending}
                    aria-label="Send"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 bg-white px-4 py-2 text-center">
            <button onClick={resetWidget} className="text-[11px] text-gray-400 hover:text-gray-600">
              {conversationId ? "End this chat and start a new one" : "New chat"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}