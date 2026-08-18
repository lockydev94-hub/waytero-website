import {
  LegalPageHeader,
  LegalBody,
  PolicySection,
  PolicyList,
} from "@/components/static/LegalSection";

export const metadata = {
  title: "Cookie Policy — WayTero",
  description: "How WayTero uses cookies and similar technologies on its website and apps.",
};

export default function CookiesPage() {
  return (
    <>
      <LegalPageHeader
        eyebrow="Legal"
        title="Cookie Policy"
        meta="Effective January 1, 2026 · Last updated August 10, 2026"
      />
      <LegalBody>
        <PolicySection heading="1. What are cookies?">
          <p>
            Cookies are small text files stored on your device when you visit a website. They
            help the site remember you, keep you signed in, and measure how the product is used.
          </p>
        </PolicySection>
        <PolicySection heading="2. Cookies we use">
          <PolicyList
            items={[
              "Essential cookies — keep you signed in, secure your session, and power the booking flow. These are always on.",
              "Preference cookies — remember your city, search dates, and display choices.",
              "Analytics cookies — help us understand how travelers use the site so we can improve it.",
              "Marketing cookies — used only with your consent to show relevant travel offers.",
            ]}
          />
        </PolicySection>
        <PolicySection heading="3. Managing cookies">
          <p>
            You can block or delete cookies in your browser settings at any time. Essential
            cookies cannot be disabled without affecting core features like booking and
            payments. For details on how we handle your data, see our{" "}
            <a href="/privacy" className="text-primary-600 font-semibold">
              Privacy Policy
            </a>
            .
          </p>
        </PolicySection>
        <PolicySection heading="4. Contact">
          <p>
            Questions about this policy? Email{" "}
            <a href="mailto:privacy@waytero.com" className="text-primary-600 font-semibold">
              privacy@waytero.com
            </a>
            .
          </p>
        </PolicySection>
      </LegalBody>
    </>
  );
}
