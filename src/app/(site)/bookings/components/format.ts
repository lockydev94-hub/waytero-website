/** Shared formatting + PDF helpers for the /bookings page components. */

/** Format a stay stamp (ISO) as date + time. Property-recorded check-in/out
 *  stamps carry a time, while the booked window is date-only. */
export function fmtStayStamp(v: string | null | undefined): string {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  const hasTime = v.includes("T");
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(hasTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

/** Save a blob under a filename. */
export async function savePdfBlob(fn: () => Promise<Blob>, filename: string): Promise<void> {
  const blob = await fn();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Translate the backend's {detail} error envelope — which arrives streamed as
 *  a JSON Blob on a failed download — into a human-readable message. */
export async function pdfErrorMsg(e: unknown): Promise<string> {
  const body = (e as { response?: { data?: unknown } })?.response?.data;
  if (body instanceof Blob) {
    try {
      const parsed = JSON.parse(await body.text());
      return parsed.detail || parsed.message || "Couldn't download the document.";
    } catch {
      /* non-JSON blob — keep the default message */
    }
  }
  return "Couldn't download the document.";
}
