/**
 * JsonLd — server-safe structured-data script tag.
 *
 * Emits one `<script type="application/ld+json">` with the given object.
 * Used by the prerendered SEO pages (/cabs/{trip}, /destinations/{city},
 * /hotels/city/{city}) so crawlers see the schema in the initial HTML.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** Build a FAQPage schema node from visible on-page questions/answers. */
export function faqPageSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}
