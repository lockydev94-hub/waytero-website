// ============================================================
// WAYTERO CUSTOMER — WALLET SERVICE
// Doc Ref: BRD Part 3 §44-45 — wallet, refunds, settlements
//   GET /customers/me/wallet          → balance + recent activity
//   GET /customers/me/wallet/ledger   → paginated transaction history
// Auth is attached automatically by the apiClient interceptor.
// ============================================================
import apiClient from "@/lib/api";

export interface WalletLedgerEntry {
  id: number;
  ref: string | null;
  ref_type: string | null;
  debit: number;
  credit: number;
  balance_after: number;
  narration: string | null;
  created_at: string | null;
}

export interface CustomerWallet {
  id: number | null;
  wallet_status: string;
  available_balance: number;
  hold_balance: number;
  total_balance: number;
}

export interface WalletLedgerPage {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  entries: WalletLedgerEntry[];
}

export interface WalletSummary {
  customer: {
    id: number;
    name: string;
    mobile: string | null;
    email: string | null;
  } | null;
  wallet: CustomerWallet;
  ledger: WalletLedgerPage;
}

const unwrap = <T,>(res: { data: T }): T => res.data;

export const walletService = {
  /** Balance + the 10 most recent ledger entries. */
  getSummary: () => apiClient.get<WalletSummary>("/customers/me/wallet").then(unwrap),

  /** Paginated full transaction history. */
  getLedger: (page = 1, page_size = 20) =>
    apiClient
      .get<WalletLedgerPage>("/customers/me/wallet/ledger", {
        params: { page, page_size },
      })
      .then(unwrap),
};

export default walletService;
