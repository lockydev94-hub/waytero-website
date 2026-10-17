import { Mail, Briefcase, MapPin, Clock, Users } from "lucide-react";
import {
  Container, Section, SectionHeader, Card, IconBox, Badge, ButtonLink,
  MotionStagger, MotionStaggerItem,
} from "@/components/ui";
import PageHero, { HeroAside } from "@/components/sections/PageHero";
import ProseBand from "@/components/sections/ProseBand";
import { CtaSection } from "@/components/renderers";
import { getPageBody, resolvePage, sourceNote } from "@/lib/pageBody";
import { getDesk } from "@/lib/desk";
import { PAGE_BODIES } from "@/content/pageBodies";
import type { BandTone } from "@/types/cms";
import { pageMetadata, type SeoContent } from "@/services/seoService";

const META_FALLBACK: SeoContent = {
  title: "Careers — WayTero",
  description:
    "How the WayTero team works, what a role here involves, and how to introduce yourself when nothing is posted.",
  keywords: ["WayTero careers", "jobs Bhubaneswar", "travel tech jobs"],
};

export async function generateMetadata(): Promise<import("next").Metadata> {
  return pageMetadata("careers", "/careers", META_FALLBACK);
}

/* ============================================================
   /careers — deliberately thin.

   There is no roles table, so this page has nothing to list and says so.
   A careers page that invents openings, perks or interview processes is the
   easiest way for a small platform to lose credibility with the exact people
   it wants to hire, so the honest empty state is the feature: nothing is
   posted, here is what working here is like, and here is how to reach us.
   ============================================================ */

function OpenRolesStatus() {
  return (
    <Section bg="muted" pad="tight" id="open-roles" overlay="dots-faint">
      <Container size="lg">
        <SectionHeader
          eyebrow="Join the team"
          title="Nothing is posted right now"
          subtitle="This page lists every opening before anywhere else. An empty list is not a hiring freeze announcement — it means there is no role open this week."
          accent="primary"
          underline
          animatedEyebrow
          scale="home"
        />
        <MotionStagger className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <MotionStaggerItem className="h-full">
            <Card variant="premium" className="h-full p-7 flex flex-col items-start">
              <Badge tone="primary" className="mb-4">Current status</Badge>
              <IconBox icon={<Briefcase />} tone="primary" size="md" gradient glow className="mb-4" />
              <h3 className="text-lg font-bold text-ink mb-2">No open roles</h3>
              <p className="text-sm text-ink-3 leading-relaxed">
                We are a small team and a role usually opens with a person, not with a requisition.
                That means the honest answer today is &ldquo;nothing listed&rdquo; — and that the
                door is still open, because the introductions we receive are read.
              </p>
            </Card>
          </MotionStaggerItem>
          <MotionStaggerItem className="h-full">
            <Card variant="premium" className="h-full p-7 flex flex-col items-start">
              <Badge tone="accent" className="mb-4">Introduce yourself</Badge>
              <IconBox icon={<Users />} tone="accent" size="md" gradient glow className="mb-4" />
              <h3 className="text-lg font-bold text-ink mb-2">Send what you have built</h3>
              <p className="text-sm text-ink-3 leading-relaxed mb-5">
                Engineering, design, operations, partnerships or support — say which, and point at
                one thing you made. We reply when there is something to reply to.
              </p>
              <div className="mt-auto">
                <CareersMailto label="Email the team" />
              </div>
            </Card>
          </MotionStaggerItem>
        </MotionStagger>
      </Container>
    </Section>
  );
}

/** The address and hours are read from the platform profile, never from a
 *  literal here: an office that moved and a page that did not is a bad first
 *  impression for a candidate. A blank address is left out rather than
 *  invented. */
async function WhereYouWork({ bg }: { bg: BandTone }) {
  const desk = await getDesk();
  return (
    <Section bg={bg} pad="tight" id="where" overlay="grid-faint">
      <Container size="lg">
        <SectionHeader
          eyebrow="Where the work happens"
          title="One office, one stack"
          accent="primary"
          underline
          animatedEyebrow
          scale="home"
        />
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Card variant="premium" className="p-7">
            <IconBox icon={desk.address ? <MapPin /> : <Clock />} tone="success" size="md" gradient glow className="mb-4" />
            {desk.address ? (
              <>
                <h3 className="font-bold text-ink mb-1.5">The office</h3>
                <p className="text-sm text-ink-3 leading-relaxed whitespace-pre-line">{desk.address}</p>
              </>
            ) : (
              <>
                <h3 className="font-bold text-ink mb-1.5">Where we sit</h3>
                <p className="text-sm text-ink-3 leading-relaxed">
                  The team works from one office, and the address is added here once it is on the
                  platform&rsquo;s contact record — ask and we will send it.
                </p>
              </>
            )}
          </Card>
          <Card variant="premium" className="p-7">
            <IconBox icon={<Clock />} tone="primary" size="md" gradient glow className="mb-4" />
            <h3 className="font-bold text-ink mb-1.5">Working hours</h3>
            <p className="text-sm text-ink-3 leading-relaxed">
              {desk.hours}. Roles here are not on-call rotations: the support desk covers the trips,
              and engineers are pulled in only when something is broken.
            </p>
          </Card>
        </div>
      </Container>
    </Section>
  );
}

async function CareersMailto({ label }: { label: string }) {
  const desk = await getDesk();
  return (
    <ButtonLink
      href={`mailto:${desk.email}?subject=Career%20introduction`}
      variant="gradient-primary"
      size="md"
      shine
      leftIcon={<Mail size={15} />}
    >
      {label}
    </ButtonLink>
  );
}

export default async function CareersPage() {
  const [state, desk] = await Promise.all([getPageBody("careers"), getDesk()]);
  const page = resolvePage(state, PAGE_BODIES.careers);
  const hasBody = page.sections.length > 0;

  return (
    <>
      <PageHero
        eyebrow={page.eyebrow ?? "Work with us"}
        title={page.title}
        description={page.description}
        meta={page.meta}
        side={
          <HeroAside title="How hiring actually works here">
            <ul className="space-y-3 text-sm">
              <li className="text-[13px] leading-relaxed text-ink-2">
                <span className="font-extrabold text-ink">A role opens with a person.</span> Nothing
                is posted until there is a real piece of work for someone to own.
              </li>
              <li className="text-[13px] leading-relaxed text-ink-2">
                <span className="font-extrabold text-ink">Introductions are read.</span> Not
                auto-sorted, not scored by keyword — read by whoever would be your colleague.
              </li>
              <li className="text-[13px] leading-relaxed text-ink-2">
                <span className="font-extrabold text-ink">You hear back when there is something to
                say.</span> A role, a paid trial, or a clear reason neither fits yet.
              </li>
            </ul>
            <p className="mt-4 border-t border-ink-7 pt-3 text-xs leading-relaxed text-ink-3">
              Write to {desk.email}
            </p>
          </HeroAside>
        }
        actions={
          <>
            <CareersMailto label="Send your profile" />
            <ButtonLink href="/about" variant="outline" size="lg">
              About WayTero
            </ButtonLink>
          </>
        }
      />

      <OpenRolesStatus />

      {hasBody && (
        <ProseBand
          sections={page.sections}
          eyebrow="How we work"
          title="What the job is really like"
          bg="white"
          overlay="dots-faint"
          source={sourceNote(page.source)}
        />
      )}

      <WhereYouWork bg={hasBody ? "muted" : "white"} />

      <CtaSection
        variant={{
          headline: "No role posted? Introduce yourself anyway.",
          subtitle:
            "Tell us what you build and which part of the platform you would want to own — engineering, design, operations, partnerships or support.",
          cta_text: "Email the team",
          cta_link: `mailto:${desk.email}?subject=Career%20introduction`,
        }}
        bg={hasBody ? "white" : "muted"}
        pad="tight"
        cardSize="compact"
        secondary={{ label: "Become a partner", href: "/partner" }}
      />
    </>
  );
}
