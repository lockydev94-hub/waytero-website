/**
 * Same-domain image path for photos we host on Cloudinary.
 *
 * Google will use a sitemap's `<image:loc>` from another domain only when that
 * domain is verified in Search Console — we cannot verify `res.cloudinary.com`,
 * so the photos have to be advertised under waytero.com. Next's own optimizer
 * (`/_next/image?url=…&w=1200`) does that, but its query string puts a bare `&`
 * into the sitemap XML, which is not well-formed and makes Search Console
 * reject the whole file. This route serves the same bytes on a clean path with
 * no query string, so `<image:loc>https://waytero.com/img/…</image:loc>` parses.
 *
 * `/img/<cloud>/<public_path>` → `https://res.cloudinary.com/<cloud>/image/upload/<public_path>`
 *
 *   /img/jsrlg7ye/v1795342161/waytero/tours/general_1795342159.jpg
 *     → https://res.cloudinary.com/jsrlg7ye/image/upload/v1795342161/waytero/tours/general_1795342159.jpg
 *
 * The upstream host is fixed and only image extensions are allowed, so this is
 * a narrow pass-through rather than a general-purpose proxy. Responses are
 * immutable for a year and cached at the edge: the VPS serves each photo once.
 */

const ALLOWED_EXT = /\.(jpe?g|png|webp|avif|gif)$/i;
const CLOUD = /^[a-z0-9][a-z0-9_-]{0,63}$/i;
const SEGMENT = /^[A-Za-z0-9._-]+$/;

function resolve(path: string[]): string | null {
  if (path.length < 2) return null;
  const [cloud, ...rest] = path;
  if (!CLOUD.test(cloud)) return null;
  if (!rest.every((s) => SEGMENT.test(s))) return null;
  if (rest.some((s) => s === "." || s === "..")) return null;
  const publicPath = rest.join("/");
  if (!ALLOWED_EXT.test(publicPath)) return null;
  return `https://res.cloudinary.com/${cloud}/image/upload/${publicPath}`;
}

async function serve(request: Request, path: string[]): Promise<Response> {
  const upstream = resolve(path);
  if (!upstream) return new Response("Not found", { status: 404 });

  const res = await fetch(upstream, {
    // A photo under the same public id can be replaced; a day keeps the edge
    // honest without making every request a round trip to Cloudinary.
    next: { revalidate: 86400 },
    headers: { Accept: "image/*" },
  });
  if (!res.ok || !res.body) {
    return new Response("Not found", { status: res.status === 404 ? 404 : 502 });
  }

  return new Response(request.method === "HEAD" ? null : res.body, {
    status: 200,
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "image/jpeg",
      "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      ...(res.headers.get("content-length")
        ? { "Content-Length": res.headers.get("content-length") as string }
        : {}),
    },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return serve(request, path);
}

export async function HEAD(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return serve(request, path);
}
