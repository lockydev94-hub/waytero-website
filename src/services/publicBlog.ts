/* ============================================================
   WayTero — public blog service
   Mirrors backend `GET /public/blog` endpoints.
   No auth required. Endpoint is cacheable at the CDN edge.

   Backend returns { success, data, total, page, per_page } envelope.
   ============================================================ */

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export interface BlogPostSummary {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image_url: string | null;
  author_name: string | null;
  author_avatar_url: string | null;
  tags: string[];
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlogPostDetail {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  featured_image_url: string | null;
  author_name: string | null;
  author_avatar_url: string | null;
  tags: string[];
  is_published: boolean;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  per_page: number;
}

export const publicBlogService = {
  /**
   * Fetch published blog posts with optional pagination, tag filter, and search.
   */
  async listPosts(params?: {
    page?: number;
    per_page?: number;
    tag?: string;
    search?: string;
  }): Promise<PaginatedResponse<BlogPostSummary> | null> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set("page", String(params.page));
      if (params?.per_page) searchParams.set("per_page", String(params.per_page));
      if (params?.tag) searchParams.set("tag", params.tag);
      if (params?.search) searchParams.set("search", params.search);

      const url = `${BASE_URL}/public/blog${searchParams.toString() ? "?" + searchParams.toString() : ""}`;
      const res = await fetch(url, {
        next: { revalidate: 60 },
      });
      if (!res.ok) return null;
      return (await res.json()) as PaginatedResponse<BlogPostSummary>;
    } catch {
      return null;
    }
  },

  /**
   * Fetch a single published blog post by slug.
   */
  async getPost(slug: string): Promise<BlogPostDetail | null> {
    try {
      const res = await fetch(`${BASE_URL}/public/blog/${slug}`, {
        next: { revalidate: 60 },
      });
      if (!res.ok) return null;
      const json = (await res.json()) as { success: boolean; data: BlogPostDetail };
      return json.data;
    } catch {
      return null;
    }
  },

  /**
   * Fetch all tags in use across published posts.
   */
  async listTags(): Promise<string[]> {
    try {
      const res = await fetch(`${BASE_URL}/public/blog/tags`, {
        next: { revalidate: 300 },
      });
      if (!res.ok) return [];
      const json = (await res.json()) as { success: boolean; data: string[] };
      return json.data ?? [];
    } catch {
      return [];
    }
  },
};

export default publicBlogService;