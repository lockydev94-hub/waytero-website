// ============================================================
// Shared slug helpers. Mirrors the backend rule
// (app.shared.utilities.seo.SLUG_RE: ^[a-z0-9]+(?:-[a-z0-9]+)*$).
// File: src/lib/slug.ts
// ============================================================

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** "bhubaneswar" -> "Bhubaneswar"; safe on already-pretty names. */
export function pretty(name: string): string {
  return name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
