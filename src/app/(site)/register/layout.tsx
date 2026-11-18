import type { ReactNode } from "react";

// /register is the same modal as /login on first sign-in — kept only so old
// links resolve, never as an indexable page.
export const metadata = {
  title: "Create Account",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return children;
}
