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
import { AnimatePresence, motion } from "framer-motion";
import {
  MessageCircle, X, Send, Headset, User, Phone, Mail, Clock, Wifi, WifiOff,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useChatNudge } from "@/hooks/useChatNudge";
import { useChatRealtime } from "@/hooks/useChatRealtime";
import { usePrefersReducedMotion } from "@/components/ui";
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
  const reduced = usePrefersReducedMotion();
  const messagesRef = useRef<ChatMessageItem[]>([]);
  messagesRef.current = messages;

  // Realtime for logged-in customers; guests poll instead.
  const { subscribe } = useChatRealtime(isLoggedIn ? accessToken : null);

  // Invite a first-time visitor into the chat once per session — never someone
  // who already has a thread, and never after they open the panel themselves.
  const nudge = useChatNudge({
    enabled: !open,
    skip: () => {
      try {
        return Boolean(localStorage.getItem(CONV_LS));
      } catch {
        return false;
      }
    },
  });

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
        aria-expanded={open}
        aria-haspopup="dialog"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-ink-700 to-ink-800 text-white shadow-wt-lg ring-1 ring-white/25 transition-transform hover:scale-105"
      >
        {open ? <X size={24} /> : <MessageCircle size={26} />}
      </button>

      {/* Invitation bubble — sits beside the float stack, once per session */}
      <AnimatePresence>
        {nudge.visible && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: reduced ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-[7.5rem] right-5 z-50 lg:bottom-6 lg:right-[5.5rem]"
          >
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  nudge.dismiss();
                  void openWidget();
                }}
                className="flex max-w-[min(72vw,258px)] items-start gap-2.5 rounded-2xl rounded-br-sm bg-ink-700 py-3 pl-3.5 pr-8 text-left text-white shadow-wt-lg ring-1 ring-white/20 transition-colors hover:bg-ink-800"
              >
                <span aria-hidden className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-accent-500" />
                <span>
                  <span className="block text-sm font-bold leading-tight">Need a hand?</span>
                  <span className="mt-0.5 block text-xs leading-snug text-white/75">
                    Start a chat — a WayTero team member picks it up.
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={nudge.dismiss}
                aria-label="Dismiss invitation"
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full text-white/55 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Chat with WayTero support"
          className="fixed bottom-24 right-5 z-50 flex w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink-900 shadow-[0_24px_60px_rgba(6,17,34,0.55)] lg:bottom-[10rem]"
        >
          {/* Header */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-ink-700 to-ink-800 px-4 py-3 text-white">
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
          <div className="flex max-h-[420px] min-h-[320px] flex-col overflow-y-auto bg-ink-900">
            {view === "welcome" && (
              <div className="p-4">
                <p className="mb-3 text-sm text-white/80">
                  Hi! What would you like to talk about?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {TOPICS.map((t) => (
                    <button
                      key={t}
                      onClick={() => pickTopic(t)}
                      className="rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2.5 text-left text-xs font-semibold text-white transition-colors hover:border-accent-400"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {view === "identity" && (
              <div className="p-4">
                <p className="mb-3 text-sm font-semibold text-white">
                  Tell us who you are so we can help better
                </p>
                <div className="space-y-2.5">
                  <label className="block">
                    <span className="mb-1 flex items-center gap-1 text-xs font-medium text-white/70">
                      <User size={13} /> Name <span className="text-red-400">*</span>
                    </span>
                    <input
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Your name"
                      className="w-full rounded-lg border border-white/10 bg-white/[0.07] px-3 py-2 text-sm text-white placeholder:text-white/50 outline-none focus:border-accent-400"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 flex items-center gap-1 text-xs font-medium text-white/70">
                      <Phone size={13} /> Mobile <span className="text-white/55">(optional)</span>
                    </span>
                    <input
                      value={guestMobile}
                      onChange={(e) => setGuestMobile(e.target.value)}
                      placeholder="10-digit mobile"
                      inputMode="tel"
                      className="w-full rounded-lg border border-white/10 bg-white/[0.07] px-3 py-2 text-sm text-white placeholder:text-white/50 outline-none focus:border-accent-400"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 flex items-center gap-1 text-xs font-medium text-white/70">
                      <Mail size={13} /> Email <span className="text-white/55">(optional)</span>
                    </span>
                    <input
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="you@example.com"
                      type="email"
                      className="w-full rounded-lg border border-white/10 bg-white/[0.07] px-3 py-2 text-sm text-white placeholder:text-white/50 outline-none focus:border-accent-400"
                    />
                  </label>
                  <button
                    onClick={submitGuestForm}
                    disabled={!guestName.trim() || busy}
                    className="w-full rounded-lg bg-gradient-to-r from-accent-500 to-accent-600 py-2.5 text-sm font-semibold text-white transition-colors hover:from-accent-600 disabled:opacity-50"
                  >
                    {busy ? "Starting…" : "Start chat"}
                  </button>
                </div>
              </div>
            )}

            {view === "thread" && (
              <div className="flex flex-col flex-1">
                {status === "WAITING" && (
                  <div className="m-3 rounded-lg border border-amber-300/25 bg-amber-400/10 px-3 py-2 text-xs text-amber-300">
                    We're offline right now — your messages are saved and our team will reply as soon as possible.
                  </div>
                )}
                <div className="flex flex-1 flex-col gap-2 p-3">
                  {messages.length === 0 ? (
                    <p className="py-6 text-center text-xs text-white/50">
                      {subject ? `Start by telling us about "${subject}"` : "Say hi!"}
                    </p>
                  ) : (
                    messages.map((m) => {
                      const mine = m.sender_type === "CUSTOMER";
                      return (
                        <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                          <p className={`mb-0.5 px-1 text-[10px] font-semibold ${mine ? "text-white/70" : "text-white/60"}`}>
                            {mine ? "You" : m.sender_name || "WayTero Support"}
                          </p>
                          <div
                            className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                              mine
                                ? "rounded-br-sm bg-primary-600 text-white"
                                : "rounded-bl-sm border border-white/10 bg-white/[0.09] text-white"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{m.body}</p>
                            <p className={`mt-0.5 text-right text-[10px] ${mine ? "text-primary-100" : "text-white/45"}`}>
                              {timeLabel(m.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="flex items-center gap-2 border-t border-white/10 bg-ink-800 p-3">
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
                    className="flex-1 rounded-lg border border-white/10 bg-white/[0.07] px-3 py-2 text-sm text-white placeholder:text-white/50 outline-none focus:border-accent-400"
                  />
                  <button
                    onClick={() => void sendMessage()}
                    disabled={!draft.trim() || sending}
                    aria-label="Send"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-500 text-white transition-colors hover:bg-accent-600 disabled:opacity-40"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/10 bg-ink-900 px-4 py-2 text-center">
            <button onClick={resetWidget} className="text-[11px] text-white/55 transition-colors hover:text-white">
              {conversationId ? "End this chat and start a new one" : "New chat"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}