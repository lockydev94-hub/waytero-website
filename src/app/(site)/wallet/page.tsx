"use client";

/**
 * /wallet — customer wallet page.
 *
 * Shows the wallet balance (available / on-hold / total) and the full
 * transaction history with load-more pagination. Money comes from
 * GET /customers/me/wallet + /customers/me/wallet/ledger; refunds and
 * wallet credits are written by the admin/partner wallet module.
 *
 * Doc Ref: BRD Part 3 §44-45 — wallet, refunds, settlements
 */

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight, Loader2, LogIn,
  ShieldCheck, Sparkles, Calendar, Hash, ChevronRight, Info,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import walletService, { type WalletSummary, type WalletLedgerEntry } from "@/services/walletService";
import SiteAuthModal from "@/components/auth/SiteAuthModal";

const INR = (n: number | string) =>
  `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

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
      <div
        className={`h-10 w-10 rounded-xl flex-shrink-0 inline-flex items-center justify-center ${
          credit ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
        }`}
      >
        {credit ? <ArrowDownLeft className="h-4.5 w-4.5" /> : <ArrowUpRight className="h-4.5 w-4.5" />}
      </div>
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
        <div className={`font-extrabold tabular-nums ${credit ? "text-emerald-600" : "text-ink"}`}>
          {credit ? "+" : "−"}{INR(credit ? entry.credit : entry.debit)}
        </div>
        <div className="text-[11px] text-ink-4 tabular-nums">Bal {INR(entry.balance_after)}</div>
      </div>
    </li>
  );
}

export default function WalletPage() {
  const router = useRouter();
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
      <div className="min-h-screen bg-gradient-to-b from-primary-50/40 via-white to-white">
        <div className="max-w-md mx-auto px-4 sm:px-6 pt-16 pb-16">
          <div className="bg-white border border-ink-7 rounded-3xl p-8 text-center shadow-sm">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-primary-50 text-primary-600 inline-flex items-center justify-center mb-4">
              <WalletIcon className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-extrabold text-ink tracking-tight">Sign in to view your wallet</h1>
            <p className="mt-2 text-sm text-ink-3">
              Track your balance, refunds, and wallet transactions from one place.
            </p>
            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              className="mt-6 w-full h-12 rounded-xl text-white font-bold text-sm inline-flex items-center justify-center gap-2 shadow-wt-accent hover:shadow-wt-glow-accent hover:-translate-y-0.5 transition-all"
              style={{ background: "linear-gradient(135deg,#F05A22,#E04A12)" }}
            >
              <LogIn className="h-4 w-4" /> Login / Sign Up
            </button>
          </div>
        </div>
        <SiteAuthModal
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          heading="Login or Sign Up"
          subheading="Sign in to view your wallet, bookings, and refunds."
        />
      </div>
    );
  }

  const wallet = summary?.wallet;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/40 via-white to-white">
      {/* ── Header band ─────────────────────────────────────── */}
      <div className="bg-ink text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-9">
          <nav className="text-xs text-white/60 mb-3">
            <button type="button" onClick={() => router.push("/")} className="hover:text-white transition-colors">Home</button>
            <span className="mx-2">/</span>
            <span className="text-white/90">My Wallet</span>
          </nav>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-accent-400">
                <WalletIcon className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">WayTero Wallet</span>
              </div>
              <h1 className="mt-1.5 text-2xl sm:text-3xl font-extrabold tracking-tight">My Wallet</h1>
              {summary?.customer?.name && (
                <p className="mt-1 text-sm text-white/70">Hello, {summary.customer.name}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => router.push("/bookings")}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-colors"
            >
              My Bookings <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-7 pb-16">
        {/* ── Balance cards ─────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white p-6 shadow-wt-primary hover:shadow-wt-glow-primary transition-shadow">
            <div aria-hidden className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-accent-500/20 blur-3xl" />
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/70">Total balance</div>
            <div className="mt-2 text-3xl font-extrabold tabular-nums">{INR(wallet?.total_balance ?? 0)}</div>
            <div className="mt-2 text-xs text-white/70 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-accent-300" /> Instantly usable for bookings
            </div>
          </div>
          <div className="rounded-2xl bg-white/85 backdrop-blur-md border border-ink-7 p-6 shadow-wt-sm hover:shadow-wt transition-shadow">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gradient-primary">Available</div>
            <div className="mt-2 text-3xl font-extrabold text-ink tabular-nums">{INR(wallet?.available_balance ?? 0)}</div>
            <div className="mt-2 text-xs text-ink-4">Ready to spend on any trip</div>
          </div>
          <div className="rounded-2xl bg-white/85 backdrop-blur-md border border-ink-7 p-6 shadow-wt-sm hover:shadow-wt transition-shadow">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gradient-accent">On hold</div>
            <div className="mt-2 text-3xl font-extrabold text-ink tabular-nums">{INR(wallet?.hold_balance ?? 0)}</div>
            <div className="mt-2 text-xs text-ink-4">Locked for active bookings</div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* ── Ledger ──────────────────────────────────────── */}
          <div className="bg-white/85 backdrop-blur-md border border-ink-7 rounded-2xl overflow-hidden shadow-wt-sm">
            <div className="px-5 py-4 border-b border-ink-8 flex items-center justify-between bg-gradient-to-r from-primary-50/40 via-white to-transparent">
              <h2 className="font-bold text-ink">Transaction history</h2>
              <span className="text-xs text-ink-4">{totalEntries} transaction{totalEntries === 1 ? "" : "s"}</span>
            </div>

            {summaryQuery.isLoading && loadedEntries.length === 0 ? (
              <div className="py-16 flex flex-col items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                <p className="text-sm text-ink-4">Loading your wallet…</p>
              </div>
            ) : loadedEntries.length === 0 ? (
              <div className="py-16 text-center px-6">
                <WalletIcon className="h-10 w-10 text-ink-4 mx-auto mb-3" />
                <p className="text-sm text-ink-2 font-semibold">No transactions yet</p>
                <p className="mt-1 text-xs text-ink-4 max-w-xs mx-auto">
                  Refunds from cancellations and wallet credits will show up here automatically.
                </p>
              </div>
            ) : (
              <>
                <ul className="divide-y divide-ink-8">
                  {loadedEntries.map((e) => (
                    <LedgerRow key={e.id} entry={e} />
                  ))}
                </ul>
                {hasMore && (
                  <div className="p-4 border-t border-ink-8 text-center">
                    <button
                      type="button"
                      onClick={() => setLedgerPage((p) => p + 1)}
                      disabled={ledgerQuery.isLoading}
                      className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold disabled:opacity-50 transition-colors"
                    >
                      {ledgerQuery.isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Load more
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── How it works ────────────────────────────────── */}
          <div className="space-y-4">
            <div className="bg-white/85 backdrop-blur-md border border-ink-7 rounded-2xl p-6 shadow-wt-sm">
              <h3 className="font-bold text-ink inline-flex items-center gap-2">
                <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-accent-400 to-accent-600 text-white flex items-center justify-center shadow-wt-accent">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                How your wallet works
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-ink-2">
                <li className="flex gap-2.5">
                  <ArrowDownLeft className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Approved cancellations credit <strong>instantly</strong> to your wallet.</span>
                </li>
                <li className="flex gap-2.5">
                  <ArrowUpRight className="h-4 w-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <span>Wallet balance can be used to pay for any future booking.</span>
                </li>
                <li className="flex gap-2.5">
                  <Info className="h-4 w-4 text-primary-600 flex-shrink-0 mt-0.5" />
                  <span>Want it in your bank? Contact support — transfers take 1–3 business days.</span>
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border border-accent-200 bg-accent-50 p-5">
              <p className="text-sm text-ink-2">
                Have a question about a refund?{" "}
                <button
                  type="button"
                  onClick={() => router.push("/refund")}
                  className="font-bold text-primary-600 hover:underline"
                >
                  Read the refund policy
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
