interface AvatarProps {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl",
};

const TONES = [
  "bg-primary-100 text-primary-700",
  "bg-accent-100 text-accent-700",
  "bg-success-soft text-emerald-700",
  "bg-info-soft text-sky-700",
  "bg-warning-soft text-amber-700",
  "bg-rose-100 text-rose-700",
];

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function pickTone(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return TONES[h % TONES.length];
}

export default function Avatar({ name, src, size = "md", className = "" }: AvatarProps) {
  const tone = pickTone(name);
  return (
    <div
      className={`inline-flex items-center justify-center rounded-full font-bold overflow-hidden flex-shrink-0 ${SIZE[size]} ${tone} ${className}`}
      aria-label={name}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
}
