"use client";

// ============================================================
// WAYTERO — CAPTURE DIALOG SHELL
//
// The modal frame shared by the enquiry form and the mobile callback
// sheet. Keeps the pieces the two need to behave identically: backdrop
// click and Escape close, focus moves into the panel on open and back to
// the trigger on close, and the page behind stops scrolling.
// ============================================================

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  /** Accessible name for the panel — shown as the visible title is optional. */
  label: string;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  /** Desktop-centred card, or a bottom sheet on phones. */
  variant?: "center" | "sheet";
  closeDisabled?: boolean;
}

export default function Dialog({
  open,
  onClose,
  label,
  title,
  subtitle,
  children,
  variant = "center",
  closeDisabled = false,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !closeDisabled) onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Land the caret in the first field instead of on the panel.
    const field = panelRef.current?.querySelector<HTMLElement>(
      "input, select, textarea, button",
    );
    field?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreRef.current?.focus();
    };
  }, [open, onClose, closeDisabled]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[600] flex items-end sm:items-center justify-center sm:p-4 bg-[#0B1B3B]/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onClick={() => !closeDisabled && onClose()}
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className={
          variant === "sheet"
            ? "w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white shadow-[0_24px_80px_rgba(11,27,59,0.35)]"
            : "w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-[0_24px_80px_rgba(11,27,59,0.35)] max-h-[92dvh] flex flex-col overflow-hidden"
        }
      >
        {(title || subtitle) && (
          <div className="relative px-5 sm:px-7 pt-6 pb-4 border-b border-ink-8 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={closeDisabled}
              aria-label="Close"
              className="absolute right-4 top-4 h-9 w-9 rounded-xl flex items-center justify-center text-ink-4 hover:text-ink hover:bg-ink-9 transition-colors disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
            {title && (
              <h3 className="text-xl font-extrabold text-ink tracking-tight pr-8">
                {title}
              </h3>
            )}
            {subtitle && <p className="mt-1 text-sm text-ink-3 pr-8">{subtitle}</p>}
          </div>
        )}
        <div className="px-5 sm:px-7 py-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
