/**
 * StaticPageSeo — WebPage + BreadcrumbList for the hand-written pages
 * (/about, /cookies, /support, …).
 *
 * Those pages already emit their own metadata (title/description from the
 * SEO_PAGE_* CMS row, plus FAQPage where the page shows FAQs), but they had no
 * page-level entity at all: the only JSON-LD on them was the root Organization
 * graph, so a crawler could not connect the page to a WebPage node, to the
 * site's WebSite entity, or to a breadcrumb trail.
 *
 * The description is read from the same `SEO_PAGE_*` row that drives the page's
 * <meta description>, so the structured data and the SERP snippet never drift.
 */
import JsonLd, { breadcrumbList, webPageSchema } from "./JsonLd";
import { getSiteSeoMap } from "@/services/seoService";

type WebPageType = "WebPage" | "CollectionPage" | "AboutPage" | "ContactPage" | "FAQPage";

export default async function StaticPageSeo({
  pageKey,
  path,
  name,
  crumb,
  type = "WebPage",
}: {
  /** CMS key without the SEO_PAGE_ prefix, e.g. "cookies" (fetch is ISR-cached). */
  pageKey: string;
  /** Canonical path of the page, e.g. "/cookies". */
  path: string;
  /** Entity name — keep it plain; the <title> is a separate field. */
  name: string;
  /** Breadcrumb label; defaults to `name`. */
  crumb?: string;
  type?: WebPageType;
}) {
  let description = "";
  try {
    const pages = await getSiteSeoMap();
    description = (pages[pageKey.replace(/-/g, "_")]?.description ?? "").trim();
  } catch {
    // A schema lookup must never break the page — the name alone still parses.
  }

  return (
    <>
      <JsonLd data={webPageSchema({ name, description, path, type })} />
      <JsonLd
        data={breadcrumbList([
          { name: "Home", path: "/" },
          { name: crumb ?? name, path },
        ])}
      />
    </>
  );
}
