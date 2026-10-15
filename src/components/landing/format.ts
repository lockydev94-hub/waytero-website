// Shared formatting for landing blocks. Indian grouping, no decimals —
// the platform quotes whole-rupee prices everywhere else too.
export const INR = (n: number | string) =>
  `₹${Math.round(Number(n)).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

/** "OUTSTATION" → "Outstation", "TEMPO_TRAVELLER" → "Tempo Traveller". */
export const enumLabel = (v: string) =>
  v
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
