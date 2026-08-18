import { Users, Hotel, Car, MapPin } from "lucide-react";
import { Container, Section, IconBox } from "@/components/ui";
import { MotionFadeIn, MotionScrollCounter, MotionStagger, MotionStaggerItem } from "@/components/ui";
import { pick } from "@/types/cms";

interface StatsSectionProps {
  variant: Record<string, unknown>;
}

interface Stat {
  value: number;
  suffix?: string;
  label: string;
}

const PLACEHOLDER: Stat[] = [
  { value: 50000, suffix: "+", label: "Happy Travelers" },
  { value: 1200, suffix: "+", label: "Partner Hotels" },
  { value: 800, suffix: "+", label: "Verified Drivers" },
  { value: 30, suffix: "+", label: "Cities" },
];

const ICONS = [Users, Hotel, Car, MapPin];
const TONES = ["primary", "accent", "success", "info"] as const;

export default function StatsSection({ variant }: StatsSectionProps) {
  const eyebrow = pick<string>(variant, "variant_tag", pick<string>(variant, "eyebrow", "Trusted across India"));
  const headline = pick<string>(variant, "headline", "Numbers that speak");
  const stats = pick<Stat[]>(variant, "stats", PLACEHOLDER);

  return (
    <Section bg="ink" pad="lg" id="stats" className="relative overflow-hidden" overlay="grid">
      {/* Premium depth — animated mesh blobs + grid overlay */}
      <div aria-hidden className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary-500/30 blur-3xl animate-blob" />
      <div aria-hidden className="pointer-events-none absolute -bottom-28 -right-24 h-96 w-96 rounded-full bg-accent-500/25 blur-3xl animate-blob [animation-delay:4s]" />
      <div aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-primary-400/15 blur-3xl animate-blob [animation-delay:7s]" />

      <Container size="lg" className="relative">
        <MotionFadeIn className="text-center mb-12 lg:mb-16">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-accent-300 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-400" aria-hidden /> {eyebrow}
          </p>
          <h2 className="text-3xl lg:text-5xl font-extrabold text-white tracking-tight">
            <span className="text-gradient-accent">{headline}</span>
          </h2>
          <div className="mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-primary-400 via-accent-400 to-primary-400 mx-auto" aria-hidden />
        </MotionFadeIn>
        <MotionStagger className="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {stats.map((s, i) => (
            <MotionStaggerItem key={s.label}>
              <StatCell stat={s} icon={ICONS[i % ICONS.length]} tone={TONES[i % TONES.length]} delay={i * 0.08} />
            </MotionStaggerItem>
          ))}
        </MotionStagger>
      </Container>
    </Section>
  );
}

function StatCell({ stat, icon: Icon, tone, delay }: { stat: Stat; icon: typeof Users; tone: "primary" | "accent" | "success" | "info"; delay: number }) {
  return (
    <MotionFadeIn delay={delay}>
      <div className="group relative h-full text-center rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-6 transition-all duration-300 ease-[var(--ease-wt)] hover:bg-white/[0.08] hover:border-white/25 hover:-translate-y-1.5 hover:shadow-[0_8px_32px_rgba(26,86,219,0.25)] overflow-hidden">
        {/* Premium gradient hairline that brightens on hover */}
        <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        {/* Inner corner glow */}
        <div aria-hidden className="pointer-events-none absolute -top-12 -right-12 h-28 w-28 rounded-full bg-primary-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative flex justify-center mb-4">
          <IconBox
            icon={<Icon className="h-5 w-5" />}
            tone={tone}
            size="md"
            gradient
            float
            className="group-hover:scale-110 transition-transform duration-300"
          />
        </div>
        <div className="relative text-4xl lg:text-5xl font-extrabold tracking-tight tabular-nums">
          <span className="bg-gradient-to-br from-white via-white to-white/60 bg-clip-text text-transparent">
            <MotionScrollCounter value={stat.value} duration={1.6} />
            {stat.suffix ?? ""}
          </span>
        </div>
        <div className="relative mt-2 text-sm text-white/65 font-medium">{stat.label}</div>
      </div>
    </MotionFadeIn>
  );
}
