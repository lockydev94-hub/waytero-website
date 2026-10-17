// ============================================================
// PAGE BODIES — the one loader that can tell "nobody has written this
// page yet" apart from "the API is down".
//
// `publicCmsService.getLegalPage()` returns null for both. For a link that
// is fine; for a policy page it is not, because the two states need
// different handling: a body the admin never wrote (or unpublished, or
// cleared) is a deliberate state that the built-in copy answers, while an
// unreachable API is a temporary one. Both fall back to the same vetted
// text — a compliance page is never allowed to render blank — but the page
// says which of the two it is doing, and the admin editor says it too.
//
// Rule this exists to enforce (round 6, R6-1): prose may fall back, data
// may not. A band that renders numbers reads them from a live payload or
// returns null.
//
// `cache()` so generateMetadata, the hero and the prose band of one request
// share a single fetch. Server-only: it calls fetch() with `next`, so it
// must not be imported into a client component.
// ============================================================

import { cache } from "react";
import { API_BASE } from "./apiBase";
import type { LegalPage, LegalSection, PageFaqEntry } from "@/services/publicCms";

export type PageBodyState =
  | { kind: "db"; body: LegalPage }
  | { kind: "none" }
  | { kind: "down" };

const NONE: PageBodyState = { kind: "none" };
const DOWN: PageBodyState = { kind: "down" };

export const getPageBody = cache(async (slug: string): Promise<PageBodyState> => {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/public/legal/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    });
  } catch {
    return DOWN;
  }
  // 404 = no such key. 500 = the stored value is not valid JSON, which the
  // editor can also produce by hand-editing system_configurations; either way
  // there is no usable body and the built-in copy answers.
  if (res.status === 404 || res.status === 500) return NONE;
  if (!res.ok) return DOWN;
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return NONE;
  }
  const body = json as LegalPage;
  if (!body || typeof body !== "object" || !Array.isArray(body.sections)) return NONE;
  if (body.is_published === false || body.sections.length === 0) return NONE;
  return { kind: "db", body };
});

/** Which text a page is standing on, for the badge the reader sees. */
export type PageSource = "db" | "built-in" | "offline";

export interface ResolvedPage {
  title: string;
  eyebrow?: string;
  description?: string;
  sections: LegalSection[];
  faq: PageFaqEntry[];
  /** "Effective … · Last updated …" — only ever set for a database body,
   *  because a built-in fallback has no date anyone can stand behind. */
  meta?: string;
  source: PageSource;
}

export function resolvePage(state: PageBodyState, fallback: LegalPage): ResolvedPage {
  if (state.kind === "db") {
    const body = state.body;
    const meta = [
      body.effective_date ? `Effective ${body.effective_date}` : null,
      body.updated_at ? `Last updated ${body.updated_at}` : null,
    ]
      .filter(Boolean)
      .join(" · ");
    return {
      title: body.title || fallback.title,
      eyebrow: body.eyebrow || fallback.eyebrow,
      description: body.description || fallback.description,
      sections: body.sections,
      faq: Array.isArray(body.faq) ? body.faq : [],
      meta: meta || undefined,
      source: "db",
    };
  }
  return {
    title: fallback.title,
    eyebrow: fallback.eyebrow,
    description: fallback.description,
    sections: fallback.sections,
    faq: Array.isArray(fallback.faq) ? fallback.faq : [],
    source: state.kind === "down" ? "offline" : "built-in",
  };
}

/** The one sentence that explains the badge under a prose band. */
export function sourceNote(source: PageSource): string {
  if (source === "db") return "Edited by the WayTero team in the admin dashboard.";
  if (source === "offline") {
    return "The policy service is unreachable right now, so this is the copy shipped with the site.";
  }
  return "This is the copy shipped with the site. An admin can edit it in the dashboard.";
}
