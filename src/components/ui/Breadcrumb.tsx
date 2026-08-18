import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={`text-sm ${className}`}>
      <ol className="flex items-center gap-1.5 flex-wrap">
        <li>
          <Link href="/" className="inline-flex items-center gap-1 text-ink-4 hover:text-primary-600 transition-colors">
            <Home className="h-4 w-4" aria-hidden />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-ink-5" aria-hidden />
            {item.href ? (
              <Link href={item.href} className="text-ink-4 hover:text-primary-600 transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="text-ink-2 font-medium" aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
