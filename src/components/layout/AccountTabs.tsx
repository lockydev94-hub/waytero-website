"use client";

/* ============================================================
   AccountTabs — the strip that ties the signed-in pages together.

   Until now the only way to move between /profile, /bookings and /wallet was
   the header avatar dropdown — which does not exist on a phone, because the
   mobile drawer has no account links at all. This is that missing row of
   links: a nav of links (not ARIA tabs — each entry navigates, so
   aria-current is the honest affordance).

   It is page chrome, not a design-system layer: it composes Container and
   Badge and nothing else, and every page keeps its own PageHero and sections.
   ============================================================ */

import Link from "next/link";
import type { ReactNode } from "react";
import { LayoutDashboard, User, Wallet } from "lucide-react";
import { Badge, Container } from "@/components/ui";

export interface AccountTab {
  href: string;
  label: string;
  icon: ReactNode;
  /** Unread count for the notifications tab. 0 / undefined renders nothing. */
  badge?: number;
}

/** The account sections, in nav order. One list so a new page is added in one
 *  place rather than five. */
export function accountTabs(): AccountTab[] {
  return [
    { href: "/profile", label: "Profile", icon: <User /> },
    { href: "/bookings", label: "Bookings", icon: <LayoutDashboard /> },
    { href: "/wallet", label: "Wallet", icon: <Wallet /> },
  ];
}

export default function AccountTabs({
  items,
  active,
  className = "",
}: {
  items: AccountTab[];
  active: string;
  className?: string;
}) {
  return (
    <div className={`border-y border-ink-7 bg-white ${className}`}>
      <Container size="lg">
        <nav aria-label="Account sections" className="flex items-stretch gap-1 overflow-x-auto py-1.5">
          {items.map((tab) => {
            const on = tab.href === active;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={on ? "page" : undefined}
                className={`relative inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${
                  on ? "text-primary-700" : "text-ink-3 hover:bg-ink-9 hover:text-ink"
                }`}
              >
                <span aria-hidden className="inline-flex [&>svg]:h-4 [&>svg]:w-4">
                  {tab.icon}
                </span>
                {tab.label}
                {tab.badge ? (
                  <Badge tone="accent" size="sm">
                    {tab.badge > 99 ? "99+" : tab.badge}
                  </Badge>
                ) : null}
                {on && (
                  <span
                    aria-hidden
                    className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-accent-500"
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </Container>
    </div>
  );
}
