"use client";

// ============================================================
// useChatNudge — decides WHEN to invite a visitor into the chat widget.
//
// Fires at most once per browser session, and only for someone who has not
// used the widget yet: they either stay on the page for NUDGE_DWELL_MS or read
// down past NUDGE_SCROLL_MIN of it (never before NUDGE_SCROLL_PX, so a tiny
// nudge is not "engagement"). Nothing is claimed about response times — the
// caller only shows an invitation, and the real online/offline state lives in
// the panel, which asks the backend.
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";

const NUDGE_SHOWN_SS = "wt_chat_nudge_shown";
const NUDGE_DISMISSED_SS = "wt_chat_nudge_dismissed";

const NUDGE_DWELL_MS = 20_000;
const NUDGE_SCROLL_PX = 600;
const NUDGE_SCROLL_MIN = 0.3;
const NUDGE_TTL_MS = 9_000;

export function useChatNudge({
  enabled,
  skip,
}: {
  /** False while the panel is open or the visitor is already in a thread. */
  enabled: boolean;
  /** Return true to cancel the invitation (e.g. a saved conversation). */
  skip?: () => boolean;
}) {
  const [visible, setVisible] = useState(false);
  const firedRef = useRef(false);
  const skipRef = useRef(skip);
  skipRef.current = skip;

  const read = (key: string) => {
    try {
      return sessionStorage.getItem(key) === "1";
    } catch {
      return false;
    }
  };
  const write = (key: string) => {
    try {
      sessionStorage.setItem(key, "1");
    } catch {
      /* private mode / storage disabled — the in-memory guard still holds */
    }
  };

  const hide = useCallback((consumedKey?: string) => {
    firedRef.current = true;
    setVisible(false);
    if (consumedKey) write(consumedKey);
  }, []);

  const dismiss = useCallback(() => hide(NUDGE_DISMISSED_SS), [hide]);

  // Opening the widget ourselves also retires the invitation.
  useEffect(() => {
    if (!enabled) hide(NUDGE_SHOWN_SS);
  }, [enabled, hide]);

  useEffect(() => {
    if (!enabled) return;
    if (firedRef.current) return;
    if (read(NUDGE_SHOWN_SS) || read(NUDGE_DISMISSED_SS)) return;
    if (skipRef.current?.()) return;

    let dwellDone = false;
    let scrollDone = false;
    let pending = false;
    let ttl = 0;

    const fire = () => {
      if (firedRef.current) return;
      firedRef.current = true;
      write(NUDGE_SHOWN_SS);
      setVisible(true);
      ttl = window.setTimeout(() => setVisible(false), NUDGE_TTL_MS);
    };

    // Defer while the tab is hidden — a background tab has not "stayed".
    const tryFire = () => {
      if (!dwellDone && !scrollDone) return;
      if (document.hidden) {
        pending = true;
        return;
      }
      fire();
    };

    const scrolledEnough = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) return false;
      return window.scrollY >= NUDGE_SCROLL_PX && window.scrollY / max >= NUDGE_SCROLL_MIN;
    };

    const onScroll = () => {
      if (scrollDone) return;
      scrollDone = scrolledEnough();
      if (scrollDone) tryFire();
    };
    const onVisibility = () => {
      if (pending && !document.hidden) {
        pending = false;
        fire();
      }
    };

    const dwell = window.setTimeout(() => {
      dwellDone = true;
      tryFire();
    }, NUDGE_DWELL_MS);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    onScroll();

    return () => {
      window.clearTimeout(dwell);
      window.clearTimeout(ttl);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled]);

  // Escape dismisses for keyboard users.
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [visible, dismiss]);

  return { visible, dismiss };
}
