"use client";

/**
 * /wallet — customer wallet page.
 *
 * Shows the wallet balance and the full transaction history with load-more
 * pagination. Money comes from GET /customers/me/wallet +
 * /customers/me/wallet/ledger; refunds and wallet credits are written by the
 * admin/partner wallet module.
 *
 * The copy here sticks to what the two endpoints actually return. How quickly
 * a refund arrives, or whether a balance can be paid out to a bank, is decided
 * by the refund policy and by support — it is not this page's to promise.
 *
 * Doc Ref: BRD Part 3 §44-45 — wallet, refunds, settlements
 */

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight, LogIn, RefreshCw,
  Calendar, Hash,
} from "lucide-react";
import {
  Badge, Breadcrumb, Button, ButtonLink, Card, Container, EmptyState, IconBox, Section, Skeleton,
} from "@/components/ui";
import PageHero from "@/components/sections/PageHero";
import { useAuth } from "@/hooks/useAuth";
import walletService, { type WalletSummary, type WalletLedgerEntry } from "@/services/walletService";
import SiteAuthModal from "@/components/auth/SiteAuthModal";

const INR = (n: number | string) =>
  `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

function errorMessage(e: unknown): string {
  const err = e as { response?: { data?: { message?: string; detail?: string } }; message?: string };
  return err?.response?.data?.message || err?.response?.data?.detail || err?.message || "Something went wrong";
}

/** Only the two statuses the wallet module ever writes are mapped; anything
 *  else a future migration introduces falls back rather than lying. */
const STATUS_TONE: Record<string, "success" | "warning"> = {
  ACTIVE: "success",
  SUSPENDED: "warning",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) +
    " · " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function LedgerRow({ entry }: { entry: WalletLedgerEntry }) {
  const credit = entry.credit > 0;
  return (
    <li className="flex items-center gap-3.5 px-4 sm:px-5 py-4">
      <IconBox
        tone={credit ? "success" : "danger"}
        size="sm"
        icon={credit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
      />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold text-ink truncate">{entry.narration || (credit ? "Wallet credit" : "Wallet debit")}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-4">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" /> {formatDate(entry.created_at)}
          </span>
          {entry.ref && (
            <span className="inline-flex items-center gap-1 font-mono">
              <Hash className="h-3 w-3" /> {entry.ref}
            </span>
          )}
          {entry.ref_type && <span>{entry.ref_type.replace(/_/g, " ")}</span>}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className={`font-extrabold tabular-nums ${credit ? "text-success" : "text-ink"}`}>
          {credit ? "+" : "−"}{INR(credit ? entry.credit : entry.debit)}
        </div>
        <div className="text-[11px] text-ink-4 tabular-nums">Bal {INR(entry.balance_after)}</div>
      </div>
    </li>
  );
}

export default function WalletPage() {
  const auth = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [loadedEntries, setLoadedEntries] = useState<WalletLedgerEntry[]>([]);

  const summaryQuery = useQuery<WalletSummary>({
    queryKey: ["customer-wallet"],
    queryFn: () => walletService.getSummary(),
    enabled: !!auth.user,
    retry: 1,
  });
  const summary = summaryQuery.data;

  // Ledger — load page-by-page and append (summary carries page 1 already).
  const ledgerQuery = useQuery({
    queryKey: ["customer-wallet-ledger", ledgerPage],
    queryFn: () => walletService.getLedger(ledgerPage, 20),
    enabled: !!auth.user && ledgerPage > 1,
    retry: 1,
  });

  useEffect(() => {
    if (ledgerPage === 1 && summary?.ledger.entries) {
      setLoadedEntries(summary.ledger.entries);
    } else if (ledgerQuery.data?.entries) {
      setLoadedEntries((prev) => {
        const seen = new Set(prev.map((e) => e.id));
        return [...prev, ...ledgerQuery.data!.entries.filter((e) => !seen.has(e.id))];
      });
    }
  }, [ledgerPage, summary, ledgerQuery.data]);

  const totalEntries = summary?.ledger.total ?? 0;
  const hasMore = ledgerQuery.data ? ledgerPage < ledgerQuery.data.total_pages : ledgerPage === 1 && loadedEntries.length < totalEntries;

  // ── Not signed in → sign-in prompt ─────────────────────────
  if (!auth.user) {
    return (
      <Section bg="gradient" pad="md">
        <Container size="sm">
          <Card variant="premium" className="p-8 text-center">
            <IconBox icon={<WalletIcon />} tone="primary" size="xl" gradient glow className="mx-auto mb-4" />
            <h1 className="text-2xl font-extrabold text-ink tracking-tight">Sign in to view your wallet</h1>
            <p className="mt-2 text-sm text-ink-3">
              Your balance, refunds and wallet transactions, all in one place.
            </p>
            <Button
              variant="gradient-accent"
              size="lg"
              fullWidth
              shine
              className="mt-6"
              leftIcon={<LogIn className="h-4 w-4" />}
              onClick={() => setAuthOpen(true)}
            >
              Login / Sign Up
            </Button>
          </Card>
        </Container>
        <SiteAuthModal
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          heading="Login or Sign Up"
          subheading="Sign in to view your wallet, bookings, and refunds."
        />
      </Section>
    );
  }

  const wallet = summary?.wallet;
  const hold = wallet?.hold_balance ?? 0;

  return (
    <>
      <PageHero
        eyebrow="Account"
        title="My Wallet"
        accent="Wallet"
        description="Your WayTero wallet balance and every transaction recorded against it."
        bg="muted"
        overlay="dots-faint"
      />

      <Section bg="white" pad="sm" id="balance">
        <Container size="lg">
          <Breadcrumb items={[{ label: "My Wallet" }]} className="mb-5" />

          {summaryQuery.isError ? (
            <EmptyState
              icon={<WalletIcon />}
              title="Couldn't load your wallet"
              description={errorMessage(summaryQuery.error)}
              action={
                <Button
                  variant="gradient-primary"
                  leftIcon={<RefreshCw className="h-4 w-4" />}
                  onClick={() => summaryQuery.refetch()}
                >
                  Try again
                </Button>
              }
            />
          ) : (
            <Card variant="premium" gradientBorder="primary" className="p-6 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-ink-4">
                    Available balance
                  </div>
                  <div className="mt-2 text-4xl font-extrabold tabular-nums text-ink">
                    {summaryQuery.isLoading && !wallet ? (
                      <Skeleton className="h-10 w-44" />
                    ) : (
                      INR(wallet?.available_balance ?? 0)
                    )}
                  </div>
                  {hold > 0 && (
                    <p className="mt-2 text-xs text-ink-4 tabular-nums">
                      {INR(hold)} on hold · total {INR(wallet?.total_balance ?? 0)}
                    </p>
                  )}
                </div>
                {wallet && (
                  <Badge tone={STATUS_TONE[wallet.wallet_status] ?? "neutral"} dot>
                    {wallet.wallet_status.replace(/_/g, " ")}
                  </Badge>
                )}
              </div>
            </Card>
          )}

          {/* ── Ledger ──────────────────────────────────────────────────── */}
          <Card className="mt-6 overflow-hidden" padded={false}>
            <div className="px-5 py-4 border-b border-ink-8 flex items-center justify-between">
              <h2 className="font-bold text-ink">Transaction history</h2>
              <span className="text-xs text-ink-4">
                {totalEntries} transaction{totalEntries === 1 ? "" : "s"}
              </span>
            </div>

            {summaryQuery.isLoading && loadedEntries.length === 0 ? (
              <div className="divide-y divide-ink-8">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3.5 px-5 py-4">
                    <Skeleton className="h-9 w-9 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-1/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-4 w-20 flex-shrink-0" />
                  </div>
                ))}
              </div>
            ) : loadedEntries.length === 0 ? (
              <EmptyState
                className="m-4 sm:m-6"
                icon={<ArrowDownLeft />}
                title="No transactions yet"
                description="Money moving into or out of this wallet is recorded here."
              />
            ) : (
              <>
                <ul className="divide-y divide-ink-8">
                  {loadedEntries.map((e) => (
                    <LedgerRow key={e.id} entry={e} />
                  ))}
                </ul>
                {hasMore && (
                  <div className="p-4 border-t border-ink-8 text-center">
                    <Button
                      variant="primary"
                      loading={ledgerQuery.isLoading}
                      onClick={() => setLedgerPage((p) => p + 1)}
                    >
                      Load more
                    </Button>
                  </div>
                )}
              </>
            )}
          </Card>

          <Card variant="outline" className="mt-6 p-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-2">
              A refund has not arrived, or the amount looks wrong? The rules that decide it are written down.
            </p>
            <ButtonLink href="/refund" variant="outline" size="sm">
              Read the refund policy
            </ButtonLink>
          </Card>
        </Container>
      </Section>
    </>
  );
}
