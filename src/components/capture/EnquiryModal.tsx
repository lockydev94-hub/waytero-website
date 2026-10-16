"use client";

// ============================================================
// WAYTERO — "ENQUIRY NOW" MODAL (public, no login)
//
// Opened from the left-edge rail on every page under (site). What it
// collects is not a contact form: an admin triages it in
// Dashboard → Leads → Enquiries and can raise a quotation or book the
// service for that person there, so the fields must identify someone the
// booking flow can act on. That is why Service Type is required here even
// though the reference screenshot doesn't show it — without it the queue
// cannot say which of the three booking screens to open.
//
// The client rules mirror the server's exactly (EnquiryRequest in
// app/modules/admin/public_capture_api.py) so a mistake is caught before a
// network call, and the server still re-checks all of them.
// ============================================================

import { useState } from "react";
import { Loader2, PhoneCall, Send, CheckCircle2 } from "lucide-react";
import Dialog from "@/components/capture/Dialog";
import { Input, Select, Textarea } from "@/components/ui/Field";
import publicLeadsService, { type CaptureServiceType } from "@/services/publicLeads";
import { useSupportPhone } from "@/hooks/useSupportPhone";
import { telHref } from "@/lib/supportPhone";

const MOBILE_REGEX = /^[6-9]\d{9}$/;
const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const SERVICE_OPTIONS: { value: CaptureServiceType; label: string }[] = [
  { value: "CAB", label: "Cab / taxi" },
  { value: "HOTEL", label: "Hotel stay" },
  { value: "TOUR", label: "Tour package" },
  { value: "OTHER", label: "Something else" },
];

interface Errors {
  first_name?: string;
  email?: string;
  mobile?: string;
  service_type?: string;
  message?: string;
}

export default function EnquiryModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const supportPhone = useSupportPhone();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [serviceType, setServiceType] = useState<CaptureServiceType | "">("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const reset = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setMobile("");
    setServiceType("");
    setMessage("");
    setErrors({});
    setFormError(null);
    setDone(null);
  };

  const close = () => {
    // Leave the thank-you on screen only while it is open; reopening is fresh.
    reset();
    onClose();
  };

  const validate = (): Errors => {
    const next: Errors = {};
    if (firstName.trim().length < 2) next.first_name = "Enter your first name";
    if (!EMAIL_REGEX.test(email.trim())) next.email = "Enter a valid email address";
    if (!MOBILE_REGEX.test(mobile)) next.mobile = "Enter a valid 10-digit Indian mobile number";
    if (!serviceType) next.service_type = "Tell us what you need help with";
    if (message.trim().length < 5) next.message = "Add a line or two so we can help";
    return next;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    setSending(true);
    try {
      const res = await publicLeadsService.submitEnquiry({
        first_name: firstName.trim(),
        last_name: lastName.trim() || undefined,
        email: email.trim(),
        mobile,
        service_type: serviceType as CaptureServiceType,
        message: message.trim(),
      });
      setDone(res.message);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      label="Enquiry form"
      title={done ? undefined : "Get in Touch"}
      subtitle={
        done
          ? undefined
          : "Tell us what you are planning and our team will call you with options and prices."
      }
      closeDisabled={sending}
    >
      {done ? (
        <div className="py-6 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
          <h4 className="mt-4 text-lg font-extrabold text-ink">Thank you</h4>
          <p className="mt-1 text-sm text-ink-3">{done}</p>
          <p className="mt-4 text-sm text-ink-3">
            Or call <a className="font-semibold text-primary-600!" href={telHref(supportPhone)}>{supportPhone}</a> now.
          </p>
          <button
            type="button"
            onClick={close}
            className="mt-6 h-11 px-6 rounded-xl font-bold text-sm text-white inline-flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#F05A22,#E04A12)" }}
          >
            Close
          </button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First name"
              required
              value={firstName}
              error={errors.first_name}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Your first name"
              maxLength={100}
              autoFocus
            />
            <Input
              label="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
              maxLength={100}
            />
          </div>
          <Input
            label="Your email"
            required
            type="email"
            value={email}
            error={errors.email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Input
            label="Phone number"
            required
            type="tel"
            inputMode="numeric"
            value={mobile}
            error={errors.mobile}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="10-digit Indian mobile"
          />
          <Select
            label="Service type"
            required
            value={serviceType}
            error={errors.service_type}
            onChange={(e) => setServiceType(e.target.value as CaptureServiceType)}
          >
            <option value="">Select what you need</option>
            {SERVICE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Textarea
            label="Message"
            required
            value={message}
            error={errors.message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Dates, cities, number of people — anything that helps us quote."
            maxLength={4000}
          />

          {formError && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={sending}
            className="w-full h-12 rounded-xl text-white font-bold text-sm inline-flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 shadow-[0_4px_20px_rgba(240,90,34,0.40)] disabled:opacity-60 disabled:hover:translate-y-0"
            style={{ background: "linear-gradient(135deg,#F05A22,#E04A12)" }}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Submit
          </button>

          <a
            href={telHref(supportPhone)}
            className="flex items-center justify-center gap-2 text-sm text-ink-3 hover:text-ink transition-colors"
          >
            <PhoneCall className="h-4 w-4" />
            Prefer to talk? Call {supportPhone}
          </a>
        </form>
      )}
    </Dialog>
  );
}
