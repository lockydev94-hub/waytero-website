// Production URL canonicalisation: https + bare apex domain.
// Google treats www / http / trailing-slash variants as separate documents, so
// every variant must 301 to one host. Skipped locally — there is no TLS or
// apex domain on localhost, and redirecting there would break the dev loop.
import { NextResponse, type NextRequest } from "next/server";

const PRODUCTION_HOST = "waytero.com";

export function middleware(req: NextRequest) {
  const { hostname } = req.nextUrl;
  if (hostname !== PRODUCTION_HOST && hostname !== `www.${PRODUCTION_HOST}`) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  const forwardedProto = req.headers.get("x-forwarded-proto") ?? "https";
  const needsHttps = forwardedProto !== "https";
  const needsApex = hostname.startsWith("www.");
  if (!needsHttps && !needsApex) return NextResponse.next();

  url.protocol = "https:";
  url.host = PRODUCTION_HOST;
  return NextResponse.redirect(url, 308);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
