"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { ReactNode, useState } from "react";
import { MotionConfig } from "framer-motion";

export default function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() =>
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30_000,
          retry: 1,
          refetchOnWindowFocus: false,
        },
      },
    })
  );
  return (
    <QueryClientProvider client={client}>
      <MotionConfig
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        reducedMotion="user"
      >
        {children}
      </MotionConfig>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#0B1B3B",
            color: "#fff",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: 500,
            padding: "12px 16px",
          },
          success: { iconTheme: { primary: "#10B981", secondary: "#fff" } },
          error: { iconTheme: { primary: "#EF4444", secondary: "#fff" } },
        }}
      />
    </QueryClientProvider>
  );
}
