import Link from "next/link";
import { Car, Hotel, Map, MapPin, Compass } from "lucide-react";
import { Container, PageHeader, Section, IconBox, Card, MotionGlow, ButtonLink, MotionStagger, MotionStaggerItem } from "@/components/ui";

export const metadata = { title: "Page Not Found — WayTero", description: "The page you were looking for doesn't exist." };

export default function NotFound() {
  return (
    <Section bg="white" pad="lg" className="relative min-h-[calc(100vh-200px)] bg-gradient-to-br from-primary-50/60 via-white to-accent-50/40 flex items-center overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary-500/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-accent-500/15 blur-3xl" />
      <Container size="md">
        <MotionGlow color="primary" intensity={0.1} size={520}>
        <Card variant="premium" className="text-center p-8 sm:p-10 relative overflow-hidden">
          <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/70 to-transparent" />
          <div className="text-[8rem] sm:text-[10rem] leading-none font-extrabold bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 bg-clip-text text-transparent">
            404
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight mt-2">
            Looks like you took a <span className="text-gradient-primary">wrong turn</span>
          </h1>
          <p className="mt-3 text-ink-3 max-w-md mx-auto">The page you&apos;re looking for doesn&apos;t exist or has moved. Try one of these instead:</p>
          <MotionStagger className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Car, label: "Cabs", href: "/cabs", tone: "primary" as const },
              { icon: Hotel, label: "Hotels", href: "/hotels", tone: "accent" as const },
              { icon: Map, label: "Tours", href: "/tours", tone: "success" as const },
              { icon: MapPin, label: "Track", href: "/track", tone: "info" as const },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <MotionStaggerItem key={s.href}>
                  <Link href={s.href} className="block h-full">
                    <Card variant="premium" hover lift="sm" className="text-center h-full p-5">
                      <div className="inline-flex"><IconBox icon={<Icon />} tone={s.tone} size="lg" gradient /></div>
                      <div className="mt-3 text-sm font-semibold text-ink">{s.label}</div>
                    </Card>
                  </Link>
                </MotionStaggerItem>
              );
            })}
          </MotionStagger>
          <div className="mt-8">
            <ButtonLink href="/" variant="gradient-primary" size="md" shine leftIcon={<Compass className="h-4 w-4" />}>
              Back to home
            </ButtonLink>
          </div>
        </Card>
        </MotionGlow>
      </Container>
    </Section>
  );
}