import { ReactNode } from "react";

/**
 * SummaryStat — pill-shaped stat tile used in the booking header.
 */
export default function SummaryStat({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone?: "default" | "primary";
}) {
  return (
    <div
      className={`group rounded-xl px-3 py-2.5 border transition-all duration-200 ${
        tone === "primary"
          ? "bg-gradient-to-br from-primary-50 to-accent-50/30 border-primary-200 hover:border-primary-300 hover:shadow-wt-sm"
          : "bg-white border-ink-8 hover:border-primary-200 hover:shadow-wt-sm"
      }`}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-4">
        <span className={tone === "primary" ? "text-primary-600" : "text-ink-4"}>{icon}</span>
        {label}
      </div>
      <div
        className={`mt-1 text-sm font-extrabold truncate ${
          tone === "primary" ? "text-gradient-primary" : "text-ink"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
