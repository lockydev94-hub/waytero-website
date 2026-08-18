"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { cabService } from "@/services/cabService";

/**
 * WayTero auth store — supports both email (Firebase) and mobile OTP (backend).
 * Tokens land in localStorage so the existing axios interceptor picks them up.
 */
export type AuthMode = "EMAIL" | "MOBILE";

export interface AuthState {
  mode: AuthMode | null;
  user: { id?: string; name?: string; email?: string; phone?: string; avatar?: string } | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
  /** True once profile has a real mobile + real name; gates booking actions. */
  hasCompleteProfile: boolean;
  /** Auth capabilities from the backend: mobile-OTP login is only available
   *  when an SMS provider (MSG91) is integrated in admin Settings → API
   *  Integrations. null = not fetched yet. */
  authConfig: { smsConfigured: boolean; mobileLoginEnabled: boolean } | null;

  // actions (wired in Phase I)
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  /** Google sign-in via Firebase Web SDK + backend JWT exchange. */
  signInWithFirebase: () => Promise<void>;
  sendMobileOtp: (mobile: string) => Promise<string | null>;
  verifyMobileOtp: (mobile: string, otp: string) => Promise<void>;
  /** Verify a MOBILE_ATTACH OTP and link the mobile to the current
   *  (Google-signed) account — the "add mobile after Google login" step.
   *  Only used when SMS/OTP is available. */
  attachMobile: (mobile: string, otp: string) => Promise<void>;
  /** Save a mobile WITHOUT OTP (no-SMS fallback) — stored UNVERIFIED. */
  saveMobile: (mobile: string) => Promise<void>;
  /** Attach / update the email on the current (mobile-OTP) account — the
   *  optional "add email after OTP login" step. */
  updateEmail: (email: string) => Promise<void>;
  /** Fetch whether mobile-OTP login is enabled (SMS provider integrated). */
  fetchAuthConfig: () => Promise<void>;
  /** Re-evaluate profile completeness after a profile edit. */
  checkProfileCompletion: () => Promise<void>;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      mode: null,
      user: null,
      accessToken: null,
      refreshToken: null,
      loading: false,
      error: null,
      hasCompleteProfile: false,
      authConfig: null,

      // ── Email (Firebase) ──────────────────────────────
      async signInWithEmail(email, password) {
        set({ loading: true, error: null });
        try {
          // Lazy import so the SSR bundle isn't bloated.
          const { signInWithEmailAndPassword } = await import("firebase/auth");
          const { firebaseAuth } = await import("@/lib/firebase");
          const cred = await signInWithEmailAndPassword(firebaseAuth, email, password);
          const idToken = await cred.user.getIdToken();
          // Exchange the Firebase ID token for a WayTero JWT pair — the raw
          // Firebase token is not signed with our secret and would 401 on
          // every protected endpoint (booking, profile, wallet).
          const data = await cabService.signInWithFirebase(idToken);
          const access = data?.tokens?.access_token;
          const refresh = data?.tokens?.refresh_token;
          if (access) localStorage.setItem("wt_customer_access", access);
          if (refresh) localStorage.setItem("wt_customer_refresh", refresh);
          set({
            mode: "EMAIL",
            user: {
              id: data?.user?.id ?? cred.user.uid,
              name: data?.user?.full_name ?? cred.user.displayName ?? email.split("@")[0],
              email: data?.user?.email ?? cred.user.email ?? email,
              avatar: cred.user.photoURL ?? undefined,
            },
            accessToken: access ?? null,
            refreshToken: refresh ?? null,
            loading: false,
          });
        } catch (e) {
          const msg = friendlyError(e);
          set({ loading: false, error: msg });
          throw new Error(msg);
        }
      },

      async signUpWithEmail(email, password, name) {
        set({ loading: true, error: null });
        try {
          const { createUserWithEmailAndPassword, updateProfile } = await import("firebase/auth");
          const { firebaseAuth } = await import("@/lib/firebase");
          const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
          if (name) await updateProfile(cred.user, { displayName: name });
          const idToken = await cred.user.getIdToken();
          // Exchange for WayTero JWTs (raw Firebase token can't be decoded
          // by the backend — see signInWithEmail).
          const data = await cabService.signInWithFirebase(idToken);
          const access = data?.tokens?.access_token;
          const refresh = data?.tokens?.refresh_token;
          if (access) localStorage.setItem("wt_customer_access", access);
          if (refresh) localStorage.setItem("wt_customer_refresh", refresh);
          set({
            mode: "EMAIL",
            user: {
              id: data?.user?.id ?? cred.user.uid,
              name: data?.user?.full_name ?? name ?? cred.user.displayName ?? email.split("@")[0],
              email: data?.user?.email ?? cred.user.email ?? email,
              avatar: cred.user.photoURL ?? undefined,
            },
            accessToken: access ?? null,
            refreshToken: refresh ?? null,
            loading: false,
          });
        } catch (e) {
          const msg = friendlyError(e);
          set({ loading: false, error: msg });
          throw new Error(msg);
        }
      },

/** Open the Google sign-in popup, hand the ID token to the backend,
 *  and store the returned WayTero JWTs (not the raw Firebase token) so
 *  the existing axios interceptor can use them on protected routes. */
      async signInWithFirebase() {
        set({ loading: true, error: null });
        try {
          const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
          const { firebaseAuth, isFirebaseConfigured } = await import("@/lib/firebase");
          if (!isFirebaseConfigured || !firebaseAuth) {
            throw new Error(
              "Google sign-in is not configured on this site. Please use mobile OTP.",
            );
          }
          const provider = new GoogleAuthProvider();
          const cred = await signInWithPopup(firebaseAuth, provider);
          const idToken = await cred.user.getIdToken();
          // Exchange Firebase ID token → WayTero JWT pair.
          const data = await cabService.signInWithFirebase(idToken);
          const access = data?.tokens?.access_token;
          const refresh = data?.tokens?.refresh_token;
          if (access) localStorage.setItem("wt_customer_access", access);
          if (refresh) localStorage.setItem("wt_customer_refresh", refresh);
          set({
            mode: "EMAIL",
            user: {
              id: data?.user?.id ?? cred.user.uid,
              name: data?.user?.full_name ?? cred.user.displayName ?? cred.user.email ?? "Customer",
              email: data?.user?.email ?? cred.user.email ?? undefined,
              avatar: cred.user.photoURL ?? undefined,
              phone: data?.user?.mobile ?? undefined,
            },
            accessToken: access ?? null,
            refreshToken: refresh ?? null,
            loading: false,
          });
          // Check if profile completion is needed and trigger it
          await get().checkProfileCompletion();
        } catch (e) {
          const msg = friendlyError(e);
          set({ loading: false, error: msg });
          throw new Error(msg);
        }
      },

      // ── Mobile (backend OTP) ─────────────────────────
      async sendMobileOtp(mobile) {
        set({ loading: true, error: null });
        try {
          const data = await cabService.sendOtp(mobile);
          // Backend returns dev_otp in non-production so the dev flow can
          // show it in the UI instead of waiting for an SMS gateway.
          return data?.dev_otp ?? null;
        } catch (e) {
          const msg = friendlyError(e);
          set({ loading: false, error: msg });
          throw new Error(msg);
        } finally {
          set({ loading: false });
        }
      },

      async verifyMobileOtp(mobile, otp) {
        set({ loading: true, error: null });
        try {
          const data = await cabService.verifyOtp(mobile, otp);
          const access = data?.tokens?.access_token;
          const refresh = data?.tokens?.refresh_token;
          if (access) localStorage.setItem("wt_customer_access", access);
          if (refresh) localStorage.setItem("wt_customer_refresh", refresh);
          set({
            mode: "MOBILE",
            user: {
              id: data?.user?.id,
              name: data?.user?.full_name ?? mobile,
              email: data?.user?.email ?? undefined,
              phone: mobile,
            },
            accessToken: access ?? null,
            refreshToken: refresh ?? null,
            loading: false,
          });
          // Check if profile completion is needed (new OTP user has name="Customer")
          const profile = await cabService.getCustomerMe().catch(() => null);
          if (profile) {
            const hasMobile = !!profile.mobile_number;
            const hasName = !!(profile.first_name && profile.first_name !== "Customer");
            set({ hasCompleteProfile: !!(hasMobile && hasName) });
          } else {
            set({ hasCompleteProfile: false });
          }
        } catch (e) {
          const msg = friendlyError(e);
          set({ loading: false, error: msg });
          throw new Error(msg);
        }
      },

      async attachMobile(mobile, otp) {
        set({ loading: true, error: null });
        try {
          const profile = await cabService.attachMobile(mobile, otp);
          set((s) => ({
            loading: false,
            user: {
              ...(s.user ?? {}),
              phone: profile.mobile_number ?? mobile,
            },
          }));
          // Re-evaluate completeness (real mobile now → hasCompleteProfile).
          await get().checkProfileCompletion();
        } catch (e) {
          const msg = friendlyError(e);
          set({ loading: false, error: msg });
          throw new Error(msg);
        }
      },

      async saveMobile(mobile) {
        set({ loading: true, error: null });
        try {
          const profile = await cabService.saveMobile(mobile);
          set((s) => ({
            loading: false,
            user: {
              ...(s.user ?? {}),
              phone: profile.mobile_number ?? mobile,
            },
          }));
          await get().checkProfileCompletion();
        } catch (e) {
          const msg = friendlyError(e);
          set({ loading: false, error: msg });
          throw new Error(msg);
        }
      },

      async fetchAuthConfig() {
        try {
          const cfg = await cabService.getAuthConfig();
          set({
            authConfig: {
              smsConfigured: !!cfg.sms_configured,
              mobileLoginEnabled: !!cfg.mobile_login_enabled,
            },
          });
        } catch {
          // On failure default to OTP available — never lock customers out.
          set({ authConfig: { smsConfigured: false, mobileLoginEnabled: true } });
        }
      },

      async updateEmail(email) {
        set({ loading: true, error: null });
        try {
          const profile = await cabService.updateEmail(email);
          set((s) => ({
            loading: false,
            user: { ...(s.user ?? {}), email: profile.email ?? email },
          }));
        } catch (e) {
          const msg = friendlyError(e);
          set({ loading: false, error: msg });
          throw new Error(msg);
        }
      },

      logout() {
        localStorage.removeItem("wt_customer_access");
        localStorage.removeItem("wt_customer_refresh");
        set({ mode: null, user: null, accessToken: null, refreshToken: null });
      },

      async checkProfileCompletion() {
        try {
          const { default: api } = await import("@/lib/api");
          const res = await api.get("/customers/me");
          const profile = res.data?.data || res.data;
          if (!profile) throw new Error("No profile data");
          const hasMobile = !!(profile.mobile_number && !profile.mobile_number.startsWith("fb_"));
          const hasName = !!(profile.first_name && profile.first_name !== "Customer");
          set({
            hasCompleteProfile: hasMobile && hasName,
            // Keep the store's display user in sync with the DB profile. The
            // name a new OTP customer enters in the profile-completion flow
            // lands here, replacing the "Customer" placeholder so the site
            // header (which reads user.name) shows their real name.
            user: {
              ...(get().user ?? {}),
              name:
                [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
                get().user?.name,
              phone: profile.mobile_number || get().user?.phone || undefined,
              email: profile.email || get().user?.email || undefined,
            },
          });
        } catch (e) {
          // Profile might not exist yet - that's OK, we'll prompt for completion
          set({ hasCompleteProfile: false });
        }
      },
    }),
    {
      name: "wt_customer_auth",
      partialize: (s) => ({ mode: s.mode, user: s.user, accessToken: s.accessToken, refreshToken: s.refreshToken }),
    },
  ),
);

function friendlyError(e: unknown): string {
  if (typeof e === "object" && e && "code" in e) {
    const code = String((e as { code: unknown }).code);
    if (code.includes("user-not-found")) return "No account found with this email.";
    if (code.includes("wrong-password")) return "Incorrect password.";
    if (code.includes("email-already-in-use")) return "An account already exists with this email.";
    if (code.includes("weak-password")) return "Password should be at least 6 characters.";
    if (code.includes("invalid-email")) return "Invalid email address.";
    if (code.includes("too-many-requests")) return "Too many attempts. Please try later.";
  }
  if (e instanceof Error) return e.message;
  return "Something went wrong. Please try again.";
}