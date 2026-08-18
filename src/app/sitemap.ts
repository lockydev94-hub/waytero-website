import type { MetadataRoute } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://waytero.com";

interface HotelRow {
  slug?: string | null;
}
interface TourRow {
  slug: string;
}
interface BlogRow {
  slug: string;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticUrls: MetadataRoute.Sitemap = [
    { url: appUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${appUrl}/cabs`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${appUrl}/hotels`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${appUrl}/tours`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${appUrl}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${appUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${appUrl}/partner`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${appUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  ];

  // DB-driven URLs — hotels, tour packages and blog posts. Failures or an
  // empty catalogue just fall back to the static list above.
  // The hotel search endpoint caps page_size at 50, so page through up to
  // 10 pages (500 hotels) sequentially.
  const hotelSlugs: string[] = [];
  for (let page = 1; page <= 10; page++) {
    const data = await fetchJson<{ items: HotelRow[] }>(
      `${BASE_URL}/public/hotel/search?page=${page}&page_size=50`,
    );
    const slugs = (data?.items ?? []).map((h) => h.slug as string).filter(Boolean);
    if (slugs.length === 0) break;
    hotelSlugs.push(...slugs);
  }
  const [tours, blogs] = await Promise.all([
    fetchJson<{ items: TourRow[] }>(`${BASE_URL}/public/tours/packages?page_size=48`).then(
      (data) => (data?.items ?? []).map((t) => t.slug).filter(Boolean),
    ),
    fetchJson<{ data: BlogRow[] }>(`${BASE_URL}/public/blog?per_page=50`).then(
      (data) => (data?.data ?? []).map((b) => b.slug).filter(Boolean),
    ),
  ]);

  const detailUrls: MetadataRoute.Sitemap = [
    ...hotelSlugs.map((slug) => ({
      url: `${appUrl}/hotels/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...tours.map((slug) => ({
      url: `${appUrl}/tours/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...blogs.map((slug) => ({
      url: `${appUrl}/blog/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];

  return [...staticUrls, ...detailUrls];
}
