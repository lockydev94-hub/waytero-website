import type { ReactNode } from "react";
import { pageMetadata } from "@/services/seoService";

// Client page — metadata lives in the route layout.
export async function generateMetadata() {
  return pageMetadata("wallet", "/wallet", {
    title: "Travel Wallet",
    description:
      "WayTero Travel Wallet — instant refunds, transparent balance, and a full transaction audit trail.",
    keywords: ["travel wallet", "refund wallet", "WayTero wallet"],
  });
}

export default function WalletLayout({ children }: { children: ReactNode }) {
  return children;
}
