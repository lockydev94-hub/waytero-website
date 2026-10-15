// ============================================================
// Single source for the API base URL. NEXT_PUBLIC_API_URL already
// includes the /api/v1 suffix (see next.config.ts) — never append it here.
// File: src/lib/apiBase.ts
// ============================================================

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
