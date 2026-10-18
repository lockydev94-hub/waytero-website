"use client";

/**
 * /notifications — the customer inbox.
 *
 * Doc Ref: API Doc — Notifications (GET /notifications/me/notifications,
 * POST /notifications/me/notifications/{id}/read, …/read-all)
 *
 * Rows come from the notification outbox: the cancellation and vehicle-swap
 * events the booking flows write directly, plus the lifecycle emails mirrored
 * into the inbox. Opening a row marks it read and, when the row carries a
 * master booking id, jumps to that booking.
 */

import { useState, type ReactNode } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  Bell,
  Car,
  CheckCheck,
  CheckCircle2,
  FileText,
  Info,
  Receipt,
  RefreshCw,
  RotateCcw,
  Wallet,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  NOTIFICATIONS_LIST_KEY,
  NOTIFICATIONS_UNREAD_KEY,
  useUnreadNotificationCount,
} from "@/hooks/useUnreadNotifications";
import notificationService, {
  type NotificationRow,
} from "@/services/notificationService";
import SiteAuthModal from "@/components/auth/SiteAuthModal";
import PageHero from "@/components/sections/PageHero";
import AccountTabs, { accountTabs } from "@/components/layout/AccountTabs";
import {
  Button,
  Card,
  Container,
  EmptyState,
  IconBox,
  Section,
  Skeleton,
} from "@/components/ui";

const PAGE = 20;

const SCOPE = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
] as const;

type Scope = (typeof SCOPE)[number]["key"];

/** One glyph per event the outbox can hold. Anything unseen falls back to a
 *  plain info mark rather than being guessed at. */
const GLYPH: Record<string, { icon: ReactNode; tone: "success" | "warning" | "danger" | "info" | "primary" | "accent" }> = {
  BOOKING_REQUESTED: { icon: <FileText />, tone: "info" },
  BOOKING_CONFIRMED: { icon: <CheckCircle2 />, tone: "success" },
  BOOKING_COMPLETED: { icon: <CheckCheck />, tone: "success" },
  BOOKING_CANCELLED: { icon: <XCircle />, tone: "danger" },
  REFUND_PROCESSED: { icon: <RotateCcw />, tone: "success" },
  PAYMENT_RECEIVED: { icon: <Wallet />, tone: "primary" },
  INVOICE_ISSUED: { icon: <Receipt />, tone: "info" },
  WALLET_RECHARGED: { icon: <Wallet />, tone: "accent" },
  CAB_BREAKDOWN_REPORTED: { icon: <AlertTriangle />, tone: "warning" },
  CAB_VEHICLE_SWAPPED: { icon: <Car />, tone: "info" },
};

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

/** Short relative label; older rows fall back to a date so "43 d ago" never
 *  replaces information the customer needs. */
function since(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const mins = Math.round((Date.now() - then) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  if (days < 14) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(then).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function NotificationsPage() {
  const auth = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [authOpen, setAuthOpen] = useState(false);
  const [scope, setScope] = useState<Scope>("all");
  const { count: unread } = useUnreadNotificationCount();

  const list = useInfiniteQuery({
    queryKey: [...NOTIFICATIONS_LIST_KEY, scope],
    queryFn: ({ pageParam }) =>
      notificationService.list({
        limit: PAGE,
        offset: pageParam,
        unread_only: scope === "unread",
      }),
    initialPageParam: 0,
    getNextPageParam: (last, all) => {
      if (last.items.length < PAGE) return undefined;
      return all.reduce((n, p) => n + p.items.length, 0);
    },
    enabled: !!auth.user,
    retry: 1,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: NOTIFICATIONS_LIST_KEY });
    qc.invalidateQueries({ queryKey: NOTIFICATIONS_UNREAD_KEY });
  };

  const readMutation = useMutation({
    mutationFn: (id: number) => notificationService.markRead(id),
    onSuccess: invalidate,
    onError: () => toast.error("Could not mark that as read"),
  });

  const allReadMutation = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: (res) => {
      toast.success(
        res.marked > 0 ? `${res.marked} marked as read` : "Nothing unread",
      );
      invalidate();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  if (!auth.user) {
    return (
      <Section bg="gradient" pad="md">
        <Container size="sm">
          <Card variant="premium" className="p-8 text-center">
            <IconBox
              icon={<Bell />}
              tone="primary"
              size="xl"
              gradient
              glow
              className="mx-auto mb-4"
            />
            <h1 className="text-2xl font-extrabold tracking-tight text-ink">
              Sign in to view your <span className="text-gradient-primary">notifications</span>
            </h1>
            <p className="mt-2 text-sm text-ink-3">
              Booking confirmations, refunds and trip updates land here.
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
          subheading="Sign in to see your notifications, bookings and wallet."
        />
      </Section>
    );
  }

  const rows = list.data?.pages.flatMap((p) => p.items) ?? [];
  const openRow = (row: NotificationRow) => {
    if (!row.read_at) readMutation.mutate(row.id);
    if (row.booking_id) router.push(`/bookings?booking=${row.booking_id}`);
  };

  return (
    <>
      <PageHero
        eyebrow="Account"
        title="My Notifications"
        accent="Notifications"
        description="Everything we have sent you about your bookings, in one place."
        bg="muted"
        overlay="dots-faint"
      />
      <AccountTabs items={accountTabs(unread)} active="/notifications" />

      <Section bg="white" pad="sm">
        <Container size="lg">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div
              role="group"
              aria-label="Filter notifications"
              className="inline-flex rounded-xl bg-ink-9 p-1"
            >
              {SCOPE.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  aria-pressed={scope === s.key}
                  onClick={() => setScope(s.key)}
                  className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                    scope === s.key
                      ? "bg-white text-primary-700 shadow-wt-sm"
                      : "text-ink-3 hover:text-ink"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <Button
              variant="subtle"
              size="sm"
              leftIcon={<CheckCheck className="h-4 w-4" />}
              loading={allReadMutation.isPending}
              disabled={unread === 0}
              onClick={() => allReadMutation.mutate()}
            >
              Mark all read
            </Button>
          </div>

          <Card padded={false} className="overflow-hidden">
            <div className="border-b border-ink-8 px-5 py-4">
              <h2 className="font-bold text-ink">Inbox</h2>
              <p className="text-xs text-ink-4">
                {unread > 0 ? `${unread} unread` : "All caught up"}
              </p>
            </div>

            {list.isLoading && (
              <div className="divide-y divide-ink-8">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-3.5 px-5 py-4">
                    <Skeleton className="h-9 w-9 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-2/3" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {list.isError && (
              <EmptyState
                className="m-0"
                icon={<AlertTriangle />}
                title="Couldn't load your notifications"
                description={errorMessage(list.error)}
                action={
                  <Button
                    variant="gradient-primary"
                    leftIcon={<RefreshCw className="h-4 w-4" />}
                    onClick={() => list.refetch()}
                  >
                    Try again
                  </Button>
                }
              />
            )}

            {!list.isLoading && !list.isError && rows.length === 0 && (
              <EmptyState
                className="m-0"
                icon={<Bell />}
                title={scope === "unread" ? "Nothing unread" : "No notifications yet"}
                description={
                  scope === "unread" ? (
                    <>You have read everything in your inbox.</>
                  ) : (
                    <>
                      Updates about your bookings — confirmations, refunds,
                      cancellations — appear here.
                    </>
                  )
                }
                action={
                  scope === "unread" ? (
                    <Button variant="outline" onClick={() => setScope("all")}>
                      Show all
                    </Button>
                  ) : undefined
                }
              />
            )}

            {!list.isLoading && rows.length > 0 && (
              <ul className="divide-y divide-ink-8">
                {rows.map((row) => {
                  const glyph = GLYPH[row.event_type] ?? {
                    icon: <Info />,
                    tone: "primary" as const,
                  };
                  const isUnread = !row.read_at;
                  return (
                    <li key={row.id}>
                      <button
                        type="button"
                        onClick={() => openRow(row)}
                        className={`flex w-full items-start gap-3.5 px-5 py-4 text-left transition-colors hover:bg-primary-50/50 ${
                          isUnread ? "bg-white" : "bg-ink-9"
                        }`}
                      >
                        <IconBox
                          icon={glyph.icon}
                          tone={glyph.tone}
                          size="sm"
                          className="flex-shrink-0"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start gap-2">
                            <span
                              className={`flex-1 text-sm ${
                                isUnread ? "font-bold text-ink" : "font-medium text-ink-2"
                              }`}
                            >
                              {row.title}
                            </span>
                            {isUnread && (
                              <span
                                aria-label="Unread"
                                className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-accent-500"
                              />
                            )}
                          </span>
                          {row.body && (
                            <span className="mt-1 block text-xs text-ink-3">
                              {row.body}
                            </span>
                          )}
                          <span className="mt-1.5 block text-[11px] text-ink-4">
                            {since(row.created_at)}
                            {row.booking_id ? " · open booking" : ""}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {list.hasNextPage && (
            <div className="mt-5 flex justify-center">
              <Button
                variant="outline"
                loading={list.isFetchingNextPage}
                onClick={() => list.fetchNextPage()}
              >
                Load more
              </Button>
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}
