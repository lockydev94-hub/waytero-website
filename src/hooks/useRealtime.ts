"use client";

// ============================================================
// WAYTERO CUSTOMER — REALTIME WEBSOCKET HOOK
// Doc Ref: BRD Part 7 §155 — Realtime channel
//
// General-purpose WS subscriber for the customer-web. Connects to /ws with
// the customer's access token (read fresh from localStorage so it survives a
// JWT refresh), reconnecting with backoff and on tab focus. Guests have no
// JWT and fall back to REST polling (hook stays idle).
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

const TOKEN_KEY = "wt_customer_access";

export interface WSMessage<T = unknown> {
  event: string;
  data: T;
  ts: string;
}

type Handler<T = unknown> = (msg: WSMessage<T>) => void;

function wsBaseUrl(): string {
  return BASE_URL.replace(/\/api\/v1\/?$/, "").replace(/^http/, "ws");
}

export function useRealtime() {
  const user = useAuth((s) => s.user);
  const [status, setStatus] = useState<"idle" | "connecting" | "open" | "closed">("idle");
  const [lastEvent, setLastEvent] = useState<WSMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Map<string, Set<Handler>>>(new Map());
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectDelayRef = useRef<number>(1000);
  const pingTimerRef = useRef<number | null>(null);
  const isMountedRef = useRef(false);

  const connect = useCallback(() => {
    if (!isMountedRef.current) return;
    if (wsRef.current && wsRef.current.readyState <= WebSocket.OPEN) return;
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setStatus("idle");
      return;
    }
    setStatus("connecting");
    const ws = new WebSocket(`${wsBaseUrl()}/ws?token=${encodeURIComponent(token)}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("open");
      reconnectDelayRef.current = 1000;
      pingTimerRef.current = window.setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, 25_000);
    };

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data) as WSMessage;
        if (!msg || typeof msg !== "object" || !msg.event) return;
        if (msg.event === "ping") return;
        setLastEvent(msg);
        const set = handlersRef.current.get(msg.event);
        if (set) {
          set.forEach((h) => {
            try {
              h(msg);
            } catch (err) {
              console.error("ws.handler_err event=", msg.event, err);
            }
          });
        }
      } catch {
        /* ignore */
      }
    };

    ws.onclose = () => {
      if (pingTimerRef.current) {
        window.clearInterval(pingTimerRef.current);
        pingTimerRef.current = null;
      }
      setStatus("closed");
      if (wsRef.current === ws) wsRef.current = null;
      if (!isMountedRef.current) return;
      const delay = reconnectDelayRef.current;
      reconnectDelayRef.current = Math.min(delay * 2, 30_000);
      reconnectTimerRef.current = window.setTimeout(connect, delay);
    };

    ws.onerror = () => {
      /* onclose handles reconnect */
    };
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    if (user) connect();
    return () => {
      isMountedRef.current = false;
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (pingTimerRef.current) {
        window.clearInterval(pingTimerRef.current);
        pingTimerRef.current = null;
      }
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [user, connect]);

  // Reconnect on tab focus — browsers may have killed the socket while the
  // tab was backgrounded even though the server never saw a close.
  useEffect(() => {
    const onFocus = () => {
      if (user && (!wsRef.current || wsRef.current.readyState >= WebSocket.CLOSING)) {
        connect();
      }
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [user, connect]);

  const subscribe = useCallback(<T = unknown,>(event: string, handler: Handler<T>) => {
    let set = handlersRef.current.get(event);
    if (!set) {
      set = new Set();
      handlersRef.current.set(event, set);
    }
    set.add(handler as Handler);
    return () => {
      const s = handlersRef.current.get(event);
      if (s) {
        s.delete(handler as Handler);
        if (s.size === 0) handlersRef.current.delete(event);
      }
    };
  }, []);

  return { status, lastEvent, subscribe };
}
