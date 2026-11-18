import type { ReactNode } from "react";
import { pageMetadata } from "@/services/seoService";

// Client page — metadata lives in the route layout.
export async function generateMetadata() {
  const meta = await pageMetadata("wallet", "/wallet", {
    title: "Travel Wallet",
    description:
      "WayTero Travel Wallet — transparent balance and a full transaction audit trail.",
    keywords: ["travel wallet", "refund wallet", "WayTero wallet"],
  });
  return { ...meta, robots: { index: false, follow: false } };
}

export default function WalletLayout({ children }: { children: ReactNode }) {
  return children;
}
