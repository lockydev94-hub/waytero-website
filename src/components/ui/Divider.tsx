interface DividerProps {
  className?: string;
  label?: string;
}

export default function Divider({ className = "", label }: DividerProps) {
  if (!label) {
    return <hr className={`border-0 border-t border-ink-7 ${className}`} />;
  }
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex-1 h-px bg-ink-7" />
      <span className="text-xs font-semibold uppercase tracking-wider text-ink-4">{label}</span>
      <div className="flex-1 h-px bg-ink-7" />
    </div>
  );
}
