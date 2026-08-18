"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Container, Card, ButtonLink, MotionGlow } from "@/components/ui";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("WayTero runtime error:", error);
  }, [error]);

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-primary-50/60 via-white to-accent-50/40 flex items-center justify-center p-6 overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary-500/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-accent-500/15 blur-3xl" />
      <Container size="sm">
        <MotionGlow color="danger" intensity={0.1} size={520}>
        <Card variant="premium" className="text-center p-8 sm:p-10 relative overflow-hidden">
          <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/70 to-transparent" />
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 text-white mb-5 shadow-wt-sm">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-ink tracking-tight">
            Something went <span className="text-gradient-primary">wrong</span>
          </h1>
          <p className="mt-2 text-ink-3">We&apos;ve been notified. Please try again or head back home.</p>
          {error.digest && <p className="mt-2 text-xs text-ink-5 font-mono">{error.digest}</p>}
          <div className="mt-6 flex gap-3 justify-center">
            <ButtonLink href="/" variant="gradient-primary" size="md" shine>
              Go home
            </ButtonLink>
            <button
              onClick={() => reset()}
              className="h-11 px-5 rounded-xl border border-ink-7 text-ink-2 hover:bg-ink-9 hover:border-primary-200 font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5"
            >
              Try again
            </button>
          </div>
        </Card>
        </MotionGlow>
      </Container>
    </div>
  );
}