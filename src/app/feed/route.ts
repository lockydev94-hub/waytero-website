import { NextResponse } from "next/server";

// ── WayTero Travel Blog — RSS 2.0 feed (app/(site)/blog hub links it via
//    metadata.alternates.types). DB-driven: every published post. ──────────
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
const SITE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3002";

interface BlogRow {
  title: string;
  slug: string;
  excerpt?: string | null;
  author_name?: string | null;
  published_at?: string | null;
  updated_at?: string | null;
  tags?: string[] | null;
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");

export const revalidate = 300;

export async function GET() {
  let posts: BlogRow[] = [];
  try {
    const res = await fetch(`${API}/public/blog?per_page=50`, {
      next: { revalidate: 300 },
    });
    const json = await res.json();
    if (json?.success && Array.isArray(json.data)) posts = json.data;
  } catch {
    // feed stays valid but empty if the API is unreachable
  }

  const items = posts
    .map((p) => {
      const url = `${SITE}/blog/${p.slug}`;
      const date = p.published_at ?? p.updated_at ?? new Date().toISOString();
      return [
        "    <item>",
        `      <title>${esc(p.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <pubDate>${new Date(date).toUTCString()}</pubDate>`,
        p.author_name ? `      <dc:creator>${esc(p.author_name)}</dc:creator>` : "",
        p.tags?.length ? `      <category>${p.tags.map(esc).join(", ")}</category>` : "",
        p.excerpt ? `      <description>${esc(p.excerpt)}</description>` : "",
        "    </item>",
      ].filter(Boolean).join("\n");
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>WayTero Travel Blog</title>
    <link>${SITE}/blog</link>
    <description>Routes, stays, refund hacks, and behind-the-scenes from the WayTero team — written for how India actually travels.</description>
    <language>en-in</language>
    <atom:link href="${SITE}/feed" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
