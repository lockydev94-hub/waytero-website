import Link from "next/link";
import { ArrowRight, FileText, PhoneCall, ShieldCheck, Wallet } from "lucide-react";
import { Container, Section, SectionHeader, MotionStagger, MotionStaggerItem } from "@/components/ui";
import type { BandTone } from "@/types/cms";

/* ============================================================
   PartnerProcessBand — what actually happens after you hit submit.

   Every step is a behaviour in the code, not a marketing stage:
   the 48-hour answer and the one-application-per-mobile rule are in
   public_leads_api.py; the document / GST / bank fields are the
   partner_documents table and Partner.gst_number / ifsc_code; the
   settlement wording follows settlement_api.py, where a booking only
   becomes settleable once it is COMPLETED, invoiced and fully paid.
   ============================================================ */

const STEPS = [
  {
    icon: FileText,
    title: "Apply",
    desc: "Business name, type, a contact and one mobile number. While an application on that number is still under review, a second one is refused rather than queued.",
  },
  {
    icon: PhoneCall,
    title: "Review — 48 hours",
    desc: "The partnerships team reads the application and gets back to you inside 48 hours. That clock is what the form's confirmation is built on.",
  },
  {
    icon: ShieldCheck,
    title: "Documents",
    desc: "KYC documents, a bank account and — for company partners — GST details, uploaded in the portal. Each one is verified before it counts, starting from PENDING.",
  },
  {
    icon: Wallet,
    title: "Live & settled",
    desc: "Your inventory appears to travellers. Settlement runs against completed bookings — invoice generated and the balance collected first, through the partner desk.",
  },
];

export default function PartnerProcessBand({
  bg = "muted",
  pad = "tight",
  eyebrow = "From form to first booking",
  title = "How onboarding actually runs",
  subtitle = "Four steps, each one a rule in the system rather than an intention. Read them before you apply so nothing surprises you after.",
}: {
  bg?: BandTone;
  pad?: "home" | "tight" | "sm" | "md" | "lg";
  eyebrow?: string;
  title?: string;
  subtitle?: string;
}) {
  // Cards take the opposite light step to the band, or they vanish into it.
  const cardTone = bg === "white" ? "border-ink-7 bg-ink-9/60" : "border-ink-7 bg-white";

  return (
    <Section bg={bg} pad={pad} id="process" overlay="dots-faint">
      <Container size="xl">
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          accent="primary"
          underline
          animatedEyebrow
          scale={pad === "home" || pad === "tight" ? "home" : "default"}
        />

        <MotionStagger className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <MotionStaggerItem key={s.title} className="h-full">
                <div className={`relative flex h-full flex-col rounded-2xl border p-5 ${cardTone}`}>
                  <span className="absolute right-4 top-3 text-3xl font-extrabold leading-none text-ink-7/70" aria-hidden>
                    {i + 1}
                  </span>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 text-white shadow-wt-sm">
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <h3 className="mt-4 text-sm font-extrabold text-ink">{s.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-ink-3">{s.desc}</p>
                </div>
              </MotionStaggerItem>
            );
          })}
        </MotionStagger>

        <div className={`mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border px-5 py-4 ${bg === "white" ? "border-ink-7 bg-white" : "border-ink-7 bg-white/70"}`}>
          <span className="text-xs font-bold uppercase tracking-wide text-ink-4">Before you apply</span>
          <Link href="/partner#coverage" className="text-xs font-extrabold text-primary-700 hover:text-primary-800">
            See where we sell today
          </Link>
          <Link href="/refund" className="text-xs font-extrabold text-primary-700 hover:text-primary-800">
            Cancellation terms travellers see
          </Link>
          <Link href="/contact" className="inline-flex items-center gap-1 text-xs font-extrabold text-primary-700 hover:text-primary-800">
            Ask the partnerships desk
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </Container>
    </Section>
  );
}
