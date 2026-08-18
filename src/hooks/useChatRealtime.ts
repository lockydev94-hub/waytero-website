// ============================================================
// WAYTERO CUSTOMER — REALTIME WEBSOCKET HOOK
// Doc Ref: BRD Part 7 §155 — Realtime channel
//
// Lightweight WS subscriber for the chat widget. Connects to /ws with
// the customer's access token when they're logged in, reconnecting with
// backoff. Guests have no JWT and fall back to REST polling instead.
// ============================================================

"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export interface WSMessage<T = unknown> {
  event: string;
  data: T;
  ts: string;
}

type Handler<T = unknown> = (msg: WSMessage<T>) => void;

function wsBaseUrl(): string {
  return BASE_URL.replace(/\/api\/v1\/?$/, "").replace(/^http/, "ws");
}

export function useChatRealtime(token: string | null) {
  const [status, setStatus] = useState<"idle" | "connecting" | "open" | "closed">("idle");
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Map<string, Set<Handler>>>(new Map());
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectDelayRef = useRef<number>(1000);
  const isUnmountedRef = useRef(false);

  const connect = useCallback(() => {
    if (isUnmountedRef.current) return;
    if (wsRef.current && wsRef.current.readyState <= WebSocket.OPEN) return;
    if (!token) return;
    setStatus("connecting");
    const ws = new WebSocket(`${wsBaseUrl()}/ws?token=${encodeURIComponent(token)}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("open");
      reconnectDelayRef.current = 1000;
    };

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data) as WSMessage;
        if (!msg || typeof msg !== "object" || !msg.event) return;
        if (msg.event === "ping") return;
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
      setStatus("closed");
      if (wsRef.current === ws) wsRef.current = null;
      if (isUnmountedRef.current) return;
      const delay = reconnectDelayRef.current;
      reconnectDelayRef.current = Math.min(delay * 2, 30_000);
      reconnectTimerRef.current = window.setTimeout(connect, delay);
    };

    ws.onerror = () => {
      /* onclose handles reconnect */
    };
  }, [token]);

  useEffect(() => {
    isUnmountedRef.current = false;
    if (!token) {
      setStatus("idle");
      return;
    }
    connect();
    return () => {
      isUnmountedRef.current = true;
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      wsRef.current?.close();
      wsRef.current = null;
      setStatus("closed");
    };
  }, [connect, token]);

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

  return { status, subscribe };
}