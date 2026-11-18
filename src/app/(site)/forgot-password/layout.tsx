import type { ReactNode } from "react";

// Recovery flow — transactional, no search value.
export const metadata = {
  title: "Reset Password",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function ForgotPasswordLayout({ children }: { children: ReactNode }) {
  return children;
}
