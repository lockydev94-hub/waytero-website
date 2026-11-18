import type { ReactNode } from "react";

// /login is a modal hand-off, not a landing page: no unique content and no
// reason to compete with the homepage in search.
export const metadata = {
  title: "Sign In",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
