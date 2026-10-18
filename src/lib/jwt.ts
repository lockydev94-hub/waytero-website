/**
 * Read the session id out of an access token.
 *
 * The login path puts `session_id` in the JWT payload, and that is the only
 * way the browser can tell which row of /auth/sessions is "this device" — the
 * endpoint itself does not mark it.
 *
 * Decoding, not verifying: the payload is base64url, not encrypted, and this
 * is only used to highlight a row. Returns null for a missing, malformed or
 * older token that carries no session_id, so the caller marks nothing rather
 * than guessing.
 */
export function decodeSessionId(accessToken: string | null | undefined): string | null {
  if (!accessToken) return null;
  const parts = accessToken.split(".");
  if (parts.length !== 3) return null;
  try {
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded)) as { session_id?: unknown };
    return typeof payload.session_id === "string" ? payload.session_id : null;
  } catch {
    return null;
  }
}
