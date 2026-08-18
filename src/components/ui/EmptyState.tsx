import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({ icon, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-12 px-6 rounded-2xl border border-dashed border-ink-7 bg-ink-9 ${className}`}>
      {icon && (
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 [&>svg]:h-7 [&>svg]:w-7">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-bold text-ink">{title}</h3>
      {description && <p className="mt-2 text-sm text-ink-3 max-w-md">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
