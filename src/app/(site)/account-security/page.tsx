"use client";

/**
 * /account-security — devices and password.
 *
 * Doc Ref: API Doc — Auth (GET /auth/sessions, POST /auth/sessions/revoke,
 * POST /auth/change-password)
 *
 * Both capabilities existed server-side with no way to reach them: a customer
 * who signed in on a shared phone had no way to end that session, and no way
 * to set a password short of the forgot-password OTP flow.
 *
 * Changing the password deactivates every session, including this one, so a
 * success here logs the customer out rather than leaving a token in
 * localStorage that the next request would reject.
 */

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  LogIn,
  MonitorSmartphone,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import authService, {
  type AuthSession,
  type ChangePasswordPayload,
} from "@/services/authService";
import { decodeSessionId } from "@/lib/jwt";
import { useUnreadNotificationCount } from "@/hooks/useUnreadNotifications";
import SiteAuthModal from "@/components/auth/SiteAuthModal";
import PageHero from "@/components/sections/PageHero";
import AccountTabs, { accountTabs } from "@/components/layout/AccountTabs";
import {
  Badge,
  Button,
  Card,
  Container,
  EmptyState,
  IconBox,
  Input,
  Section,
  Skeleton,
} from "@/components/ui";

/** The backend's real rules — app/modules/auth/schemas validates exactly
 *  these five, so the checklist promises nothing the API does not enforce. */
const RULES: { label: string; ok: (v: string) => boolean }[] = [
  { label: "At least 12 characters", ok: (v) => v.length >= 12 },
  { label: "One uppercase letter", ok: (v) => /[A-Z]/.test(v) },
  { label: "One lowercase letter", ok: (v) => /[a-z]/.test(v) },
  { label: "One number", ok: (v) => /\d/.test(v) },
  { label: "One special character", ok: (v) => /[!@#$%^&*()_+\-=[\]{}|;':",./<>?]/.test(v) },
];

function signedIn(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Two different shapes come back from a failed change:
 *  - 401 from the service: {success, message, code, errors}
 *  - 422 from FastAPI's default validation handler: {detail: [{msg, ...}]}
 * Both have to surface a sentence the customer can act on.
 */
function passwordError(e: unknown): string {
  const err = e as {
    response?: { data?: { message?: string; detail?: unknown } };
    message?: string;
  };
  const data = err?.response?.data;
  if (data?.message) return data.message;
  const detail = data?.detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { msg?: string };
    // Pydantic prefixes validator failures with "Value error, ".
    if (typeof first?.msg === "string") {
      return first.msg.replace(/^Value error,\s*/, "");
    }
  }
  if (typeof detail === "string" && detail) return detail;
  return err?.message || "Could not change your password";
}

function errorMessage(e: unknown): string {
  const err = e as {
    response?: { data?: { message?: string; detail?: string } };
    message?: string;
  };
  return (
    err?.response?.data?.message ||
    err?.response?.data?.detail ||
    err?.message ||
    "Something went wrong"
  );
}

export default function AccountSecurityPage() {
  const auth = useAuth();
  const qc = useQueryClient();
  const { count: unread } = useUnreadNotificationCount();
  const [authOpen, setAuthOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [changed, setChanged] = useState(false);

  const currentSessionId = useMemo(
    () => decodeSessionId(auth.accessToken),
    [auth.accessToken],
  );

  const sessions = useQuery<AuthSession[]>({
    queryKey: ["auth-sessions"],
    queryFn: () => authService.listSessions(),
    enabled: !!auth.user,
    retry: 1,
  });

  const revoke = useMutation({
    mutationFn: (id: string) => authService.revokeSession(id),
    onSuccess: () => {
      toast.success("That device has been signed out");
      setConfirmId(null);
      qc.invalidateQueries({ queryKey: ["auth-sessions"] });
    },
    onError: (e) => {
      const code = (e as { response?: { data?: { code?: string } } })?.response?.data
        ?.code;
      toast.error(
        code === "RESOURCE_NOT_FOUND" ? "Session already ended" : errorMessage(e),
      );
      setConfirmId(null);
    },
  });

  const changePassword = useMutation({
    mutationFn: (payload: ChangePasswordPayload) => authService.changePassword(payload),
    onSuccess: () => {
      setPwError(null);
      setCurrent("");
      setNext("");
      setConfirm("");
      setChanged(true);
      // Every session is deactivated server-side; drop the local tokens so the
      // app does not sit on one the next request would reject.
      auth.logout();
    },
    onError: (e) => setPwError(passwordError(e)),
  });

  const rulesMet = RULES.every((r) => r.ok(next));
  const canSubmit = !!current && rulesMet && next === confirm;

  // ── Password changed → the session is gone, so this is the whole page ──
  if (changed && !auth.user) {
    return (
      <Section bg="gradient" pad="md">
        <Container size="sm">
          <EmptyState
            icon={<ShieldCheck />}
            title="Signed out for your security"
            description={
              <>
                Your password was changed and every device was signed out.
                Sign in again to get back to your account.
              </>
            }
            action={
              <Button
                variant="gradient-accent"
                leftIcon={<LogIn className="h-4 w-4" />}
                onClick={() => setAuthOpen(true)}
              >
                Sign in again
              </Button>
            }
          />
          <SiteAuthModal
            open={authOpen}
            onClose={() => setAuthOpen(false)}
            heading="Sign in"
            subheading="Use your new password, or the mobile OTP you already have."
          />
        </Container>
      </Section>
    );
  }

  if (!auth.user) {
    return (
      <Section bg="gradient" pad="md">
        <Container size="sm">
          <Card variant="premium" className="p-8 text-center">
            <IconBox
              icon={<ShieldCheck />}
              tone="primary"
              size="xl"
              gradient
              glow
              className="mx-auto mb-4"
            />
            <h1 className="text-2xl font-extrabold tracking-tight text-ink">
              Sign in to manage your <span className="text-gradient-primary">security</span>
            </h1>
            <p className="mt-2 text-sm text-ink-3">
              Review the devices signed in to your account and change your password.
            </p>
            <Button
              type="button"
              variant="gradient-accent"
              size="lg"
              fullWidth
              shine
              className="mt-6"
              onClick={() => setAuthOpen(true)}
            >
              Login / Sign Up
            </Button>
          </Card>
        </Container>
        <SiteAuthModal
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          heading="Login or Sign Up"
          subheading="Sign in to manage your devices and password."
        />
      </Section>
    );
  }

  return (
    <>
      <PageHero
        eyebrow="Account"
        title="Account Security"
        accent="Security"
        description="The devices using your account, and the password they sign in with."
        bg="muted"
        overlay="dots-faint"
      />
      <AccountTabs items={accountTabs(unread)} active="/account-security" />

      <Section bg="white" pad="sm">
        <Container size="lg" className="space-y-6">
          {/* ── Devices ─────────────────────────────────────────────────── */}
          <Card padded={false} className="overflow-hidden">
            <div className="flex items-center gap-3 border-b border-ink-8 px-5 py-4">
              <IconBox icon={<MonitorSmartphone />} tone="primary" size="sm" />
              <div>
                <h2 className="font-bold text-ink">Signed-in devices</h2>
                <p className="text-xs text-ink-4">
                  End a session you do not recognise. It signs that device out;
                  your bookings and wallet are untouched.
                </p>
              </div>
            </div>

            {sessions.isLoading && (
              <div className="divide-y divide-ink-8">
                {[0, 1].map((i) => (
                  <div key={i} className="flex items-center gap-3.5 px-5 py-4">
                    <Skeleton className="h-9 w-9 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-1/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {sessions.isError && (
              <EmptyState
                className="m-0"
                icon={<AlertTriangle />}
                title="Couldn't load your devices"
                description={errorMessage(sessions.error)}
                action={
                  <Button variant="outline" onClick={() => sessions.refetch()}>
                    Try again
                  </Button>
                }
              />
            )}

            {!sessions.isLoading && !sessions.isError && sessions.data?.length === 0 && (
              <EmptyState
                className="m-0"
                icon={<MonitorSmartphone />}
                title="No other devices"
                description="This is the only place your account is signed in."
              />
            )}

            {!sessions.isLoading && (sessions.data?.length ?? 0) > 0 && (
              <ul className="divide-y divide-ink-8">
                {sessions.data!.map((s) => {
                  const here = !!currentSessionId && s.id === currentSessionId;
                  const asking = confirmId === s.id;
                  return (
                    <li key={s.id} className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <IconBox icon={<MonitorSmartphone />} tone="neutral" size="sm" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="min-w-0 truncate text-sm font-bold text-ink">
                              {s.device_name || "Unknown device"}
                            </span>
                            {here && (
                              <span className="flex-shrink-0">
                                <Badge tone="success" size="sm" dot>
                                  This device
                                </Badge>
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 text-xs text-ink-4 sm:truncate">
                            {signedIn(s.created_at)}
                            {s.ip_address ? ` · ${s.ip_address}` : ""}
                          </div>
                        </div>
                        {here ? (
                          <span className="hidden text-xs text-ink-4 sm:inline">
                            You&apos;re signed in here
                          </span>
                        ) : asking ? (
                          <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
                            <span className="mr-auto text-xs font-semibold text-ink-2 sm:mr-0">
                              Sign this device out?
                            </span>
                            <Button
                              variant="danger"
                              size="sm"
                              loading={revoke.isPending}
                              onClick={() => revoke.mutate(s.id)}
                            >
                              Sign out
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setConfirmId(null)}
                            >
                              Keep
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirmId(s.id)}
                          >
                            Revoke
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/* ── Password ────────────────────────────────────────────────── */}
          <Card className="sm:p-7">
            <div className="flex items-center gap-3">
              <IconBox icon={<KeyRound />} tone="accent" size="sm" />
              <div>
                <h2 className="font-bold text-ink">Change password</h2>
                <p className="text-xs text-ink-4">
                  Changing it signs every device out, including this one.
                </p>
              </div>
            </div>

            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!canSubmit) return;
                setPwError(null);
                changePassword.mutate({
                  current_password: current,
                  new_password: next,
                  confirm_password: confirm,
                });
              }}
            >
              <Input
                type="password"
                label="Current password"
                autoComplete="current-password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
              />
              <Input
                type="password"
                label="New password"
                autoComplete="new-password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
              />
              <Input
                type="password"
                label="Confirm new password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                error={
                  confirm && next !== confirm
                    ? "The two passwords don't match"
                    : undefined
                }
                hint="Used to confirm — we don't store it."
              />

              <ul className="grid gap-1.5 sm:grid-cols-2">
                {RULES.map((r) => {
                  const ok = r.ok(next);
                  return (
                    <li
                      key={r.label}
                      className={`flex items-center gap-2 text-xs ${
                        ok ? "text-success" : "text-ink-4"
                      }`}
                    >
                      <CheckCircle2
                        className={`h-3.5 w-3.5 flex-shrink-0 ${ok ? "" : "opacity-30"}`}
                      />
                      {r.label}
                    </li>
                  );
                })}
              </ul>

              {pwError && (
                <div className="flex items-start gap-2 rounded-xl border border-danger-soft bg-danger-soft/50 px-3.5 py-2.5 text-sm text-danger">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{pwError}</span>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <Button
                  type="submit"
                  variant="gradient-primary"
                  loading={changePassword.isPending}
                  disabled={!canSubmit}
                >
                  Change password
                </Button>
              </div>
            </form>
          </Card>
        </Container>
      </Section>
    </>
  );
}
