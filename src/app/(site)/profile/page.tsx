"use client";

/**
 * /profile — customer account page (premium redesign).
 *
 * Shows identity (name, mobile, email, customer code, referral), lets the
 * customer edit personal details (first/last name, gender, date of birth,
 * city) and manage saved addresses (add / set default / delete). Links out
 * to My Bookings.
 *
 * Doc Ref: API Doc — Customer endpoints (GET/PATCH /customers/me,
 * /customers/me/addresses)
 */

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Tag,
  ChevronRight,
  Loader2,
  Plus,
  Trash2,
  Star,
  ShieldCheck,
  LayoutDashboard,
  LogIn,
  Home,
  Briefcase,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cabService, type PublicCity } from "@/services/cabService";
import customerProfileService, {
  type CustomerProfile,
  type CustomerAddress,
} from "@/services/customerProfileService";
import SiteAuthModal from "@/components/auth/SiteAuthModal";
import { Card, Button, IconBox, MotionGlow } from "@/components/ui";

const GENDER_LABELS: Record<string, string> = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
};

const ADDRESS_TYPE_LABELS: Record<string, string> = {
  HOME: "Home",
  WORK: "Work",
  OTHER: "Other",
};

const fieldCls =
  "w-full h-11 rounded-xl bg-white border border-ink-7 px-4 text-sm focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/15";
const labelCls = "block text-xs font-bold uppercase tracking-wider text-ink-3 mb-2";

function errorMessage(e: unknown): string {
  const err = e as { response?: { data?: { message?: string; detail?: string } }; message?: string };
  return err?.response?.data?.message || err?.response?.data?.detail || err?.message || "Something went wrong";
}

export default function CustomerProfilePage() {
  const router = useRouter();
  const auth = useAuth();
  const qc = useQueryClient();

  const [authOpen, setAuthOpen] = useState(false);

  const citiesQuery = useQuery<PublicCity[]>({
    queryKey: ["public-cities"],
    queryFn: () => cabService.getCities(),
    staleTime: 10 * 60 * 1000,
  });
  const cities = useMemo(() => citiesQuery.data ?? [], [citiesQuery.data]);

  const profileQuery = useQuery<CustomerProfile>({
    queryKey: ["customer-profile"],
    queryFn: () => customerProfileService.getProfile(),
    enabled: !!auth.user,
    retry: 1,
  });
  const profile = profileQuery.data;

  const cityName = useMemo(() => {
    const map = new Map(cities.map((c) => [c.id, c.name]));
    return (id?: number | null) => (id != null ? (map.get(id) ?? "—") : "—");
  }, [cities]);

  // ── Not signed in → sign-in prompt ─────────────────────────
  if (!auth.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50/60 via-white to-accent-50/40">
        <div className="max-w-md mx-auto px-4 sm:px-6 pt-16 pb-16">
          <MotionGlow color="primary" intensity={0.18} size={520}>
            <Card variant="premium" className="p-8 text-center relative overflow-hidden bg-white/85 backdrop-blur-md">
              <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/70 to-transparent" />
              <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white inline-flex items-center justify-center mb-4 shadow-wt-primary group-hover:scale-110 group-hover:-rotate-3 transition-transform">
                <User className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-extrabold text-ink tracking-tight">
                Sign in to view your <span className="text-gradient-primary">profile</span>
              </h1>
              <p className="mt-2 text-sm text-ink-3">
                Manage your personal details, saved addresses, and bookings from one place.
              </p>
              <Button
                type="button"
                variant="gradient-primary"
                size="lg"
                fullWidth
                shine
                leftIcon={<LogIn className="h-4 w-4" />}
                onClick={() => setAuthOpen(true)}
                className="mt-6"
              >
                Login / Sign Up
              </Button>
            </Card>
          </MotionGlow>
        </div>
        <SiteAuthModal
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          heading="Login or Sign Up"
          subheading="Sign in to manage your profile, bookings, and wallet."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50/40 via-white to-accent-50/20">
      {/* ── Hero ──────────────────────────────────────────── */}
      <div className="relative bg-ink text-white overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full bg-primary-500/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-accent-500/15 blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-12 sm:pt-14 sm:pb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-semibold tracking-wider uppercase mb-4">
            <User className="h-3.5 w-3.5" /> Account
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
            My <span className="text-gradient-primary">Profile</span>
          </h1>
          <p className="mt-3 text-sm sm:text-base text-white/70 max-w-2xl">
            Keep your details current so drivers and partners can reach you easily. Your
            mobile stays private for OTP verification and trip updates.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-6 sm:-mt-8 pb-12">
        {profileQuery.isLoading && (
          <div className="grid lg:grid-cols-[340px_1fr] gap-5 sm:gap-6">
            <div className="space-y-5">
              <div className="bg-white border border-ink-7 rounded-2xl p-6 animate-pulse h-64" />
            </div>
            <div className="space-y-5">
              <div className="bg-white border border-ink-7 rounded-2xl p-6 animate-pulse h-72" />
            </div>
          </div>
        )}

        {profileQuery.isError && (
          <Card variant="premium" className="p-10 text-center relative overflow-hidden">
            <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/70 to-transparent" />
            <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white inline-flex items-center justify-center mb-3 shadow-wt-primary">
              <RefreshCw className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-ink">Couldn't load your profile</h3>
            <p className="mt-2 text-sm text-ink-3">
              {errorMessage(profileQuery.error)} If your session expired, sign in again.
            </p>
            <Button
              type="button"
              variant="gradient-primary"
              size="md"
              shine
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={() => profileQuery.refetch()}
              className="mt-4 mx-auto"
            >
              Retry
            </Button>
          </Card>
        )}

        {profile && (
          <div className="grid lg:grid-cols-[340px_1fr] gap-5 sm:gap-6">
            {/* ── Left rail ─────────────────────────────────── */}
            <aside className="space-y-5 self-start lg:sticky lg:top-24">
              <IdentityCard profile={profile} cityName={cityName} />
              <ContactCard profile={profile} />
              <Card variant="premium" className="p-5">
                <h3 className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-ink-3 mb-3">
                  Quick links
                </h3>
                <button
                  type="button"
                  onClick={() => router.push("/bookings")}
                  className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-ink-2 hover:bg-primary-50 hover:text-primary-700 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-wt-sm text-left"
                >
                  <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-white inline-flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-transform">
                    <LayoutDashboard className="h-3.5 w-3.5" />
                  </span>
                  My Bookings
                  <ChevronRight className="h-4 w-4 ml-auto text-ink-4 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" />
                </button>
              </Card>
            </aside>

            {/* ── Right column ───────────────────────────────── */}
            <main className="space-y-5 min-w-0">
              <EditProfileCard
                profile={profile}
                cities={cities}
                onSaved={(updated) => {
                  qc.setQueryData<CustomerProfile>(["customer-profile"], updated);
                  void auth.checkProfileCompletion(); // keep header name in sync
                }}
              />
              <AddressesCard
                profile={profile}
                cities={cities}
                cityName={cityName}
                onChanged={() => qc.invalidateQueries({ queryKey: ["customer-profile"] })}
              />
            </main>
          </div>
        )}
      </div>
    </div>
  );
}

/* ========================================================================
 * IdentityCard — avatar, name, codes + member-since.
 * ====================================================================== */
function IdentityCard({
  profile,
  cityName,
}: {
  profile: CustomerProfile;
  cityName: (id?: number | null) => string;
}) {
  const fullName =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    profile.email?.split("@")[0] ||
    "Customer";
  const initial = (fullName.trim()[0] ?? "W").toUpperCase();
  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <Card variant="premium" className="overflow-hidden p-0">
      <div className="relative h-20 px-6 flex items-end overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-700 via-primary-600 to-accent-600" />
        <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <div aria-hidden className="pointer-events-none absolute -top-12 -right-8 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
      </div>
      <div className="px-6 pb-5 -mt-8">
        <div className="h-16 w-16 rounded-2xl inline-flex items-center justify-center text-2xl font-black text-white shadow-lg border-4 border-white bg-gradient-to-br from-primary-500 to-primary-700">
          {initial}
        </div>
        <h2 className="mt-3 text-xl font-extrabold text-ink tracking-tight break-words">{fullName}</h2>
        <div className="mt-2 space-y-1.5 text-xs text-ink-4">
          <div className="flex items-center gap-1.5">
            <IdCardGlyph />
            {profile.customer_code}
          </div>
          {profile.referral_code && (
            <div className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" /> Referral · {profile.referral_code}
            </div>
          )}
          {profile.city_id != null && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> {cityName(profile.city_id)}
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> Member since {memberSince}
          </div>
        </div>
      </div>
      <div className="px-6 py-3 border-t border-ink-8 bg-gradient-to-r from-emerald-50/40 to-white flex items-center gap-2 text-[11px] text-ink-4">
        <span className="h-5 w-5 rounded-md bg-gradient-to-br from-emerald-400 to-emerald-600 text-white inline-flex items-center justify-center">
          <ShieldCheck className="h-3 w-3" />
        </span>
        {profile.is_active ? "Account active" : "Account inactive"}
      </div>
    </Card>
  );
}

function IdCardGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-ink-4">
      <path
        d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="8.5" cy="12" r="1.8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5.5 15.5c.7-1.4 1.7-2 3-2s2.3.6 3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M15 10h4M15 13h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/* ========================================================================
 * ContactCard — mobile + email (read-only for now).
 * ====================================================================== */
function ContactCard({ profile }: { profile: CustomerProfile }) {
  const mobileDisplay =
    profile.mobile_number && !profile.mobile_number.startsWith("fb_")
      ? `+91 ${profile.mobile_number}`
      : "Not verified";
  return (
    <Card variant="premium" className="p-5">
      <h3 className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-gradient-primary mb-3">
        Contact details
      </h3>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white inline-flex items-center justify-center flex-shrink-0 shadow-wt-sm">
            <Phone className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-4">Mobile</div>
            <div className="text-sm font-semibold text-ink truncate">{mobileDisplay}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 text-white inline-flex items-center justify-center flex-shrink-0 shadow-wt-sm">
            <Mail className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-4">Email</div>
            <div className="text-sm font-semibold text-ink truncate">{profile.email || "—"}</div>
          </div>
        </div>
      </div>
      <p className="mt-3 text-[11px] text-ink-4 leading-snug">
        Your mobile is used for OTP logins and trip updates. Changes are verified via OTP.
      </p>
    </Card>
  );
}

/* ========================================================================
 * EditProfileCard — editable personal details.
 * ====================================================================== */
function EditProfileCard({
  profile,
  cities,
  onSaved,
}: {
  profile: CustomerProfile;
  cities: PublicCity[];
  onSaved: (updated: CustomerProfile) => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [cityId, setCityId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFirstName(profile.first_name ?? "");
    setLastName(profile.last_name ?? "");
    setGender(profile.gender ?? "");
    setDateOfBirth(profile.date_of_birth ? String(profile.date_of_birth).slice(0, 10) : "");
    setCityId(profile.city_id ? String(profile.city_id) : "");
  }, [profile]);

  const handleSave = async () => {
    if (!firstName.trim()) {
      toast.error("First name is required");
      return;
    }
    setSaving(true);
    try {
      const updated = await customerProfileService.updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim() || undefined,
        gender: gender ? (gender as "MALE" | "FEMALE" | "OTHER") : undefined,
        date_of_birth: dateOfBirth || undefined,
        city_id: cityId ? Number(cityId) : undefined,
      });
      onSaved(updated);
      toast.success("Profile updated");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card variant="premium" className="relative overflow-hidden p-5 sm:p-6">
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/70 to-transparent" />
      <div className="flex items-center gap-2 mb-4">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white inline-flex items-center justify-center shadow-wt-sm">
          <User className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-ink">Personal details</h3>
          <p className="text-[11px] text-ink-4">How drivers and partners address you.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>First name</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
            className={fieldCls}
          />
        </div>
        <div>
          <label className={labelCls}>Last name</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
            className={fieldCls}
          />
        </div>
        <div>
          <label className={labelCls}>Gender</label>
          <select value={gender} onChange={(e) => setGender(e.target.value)} className={fieldCls}>
            <option value="">Select</option>
            {Object.entries(GENDER_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Date of birth</label>
          <input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className={fieldCls}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>City</label>
          <select value={cityId} onChange={(e) => setCityId(e.target.value)} className={fieldCls}>
            <option value="">Select city</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Button
        type="button"
        onClick={handleSave}
        disabled={saving}
        variant="gradient-primary"
        size="md"
        shine
        leftIcon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
        className="mt-5"
      >
        Save changes
      </Button>
    </Card>
  );
}

/* ========================================================================
 * AddressesCard — list + add / set default / delete saved addresses.
 * ====================================================================== */
function AddressesCard({
  profile,
  cities,
  cityName,
  onChanged,
}: {
  profile: CustomerProfile;
  cities: PublicCity[];
  cityName: (id?: number | null) => string;
  onChanged: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState("HOME");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [postal, setPostal] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setShowForm(false);
    setType("HOME");
    setLine1("");
    setLine2("");
    setCity("");
    setPostal("");
    setIsDefault(false);
  };

  const handleAdd = async () => {
    if (!line1.trim()) {
      toast.error("Address line 1 is required");
      return;
    }
    setSaving(true);
    try {
      await customerProfileService.addAddress({
        address_type: type as "HOME" | "WORK" | "OTHER",
        address_line_1: line1.trim(),
        address_line_2: line2.trim() || undefined,
        city_id: city ? Number(city) : undefined,
        postal_code: postal.trim() || undefined,
        is_default: isDefault,
      });
      toast.success("Address saved");
      resetForm();
      onChanged();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await customerProfileService.setDefaultAddress(id);
      toast.success("Default address updated");
      onChanged();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this saved address?")) return;
    try {
      await customerProfileService.deleteAddress(id);
      toast.success("Address deleted");
      onChanged();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const addresses = profile.addresses ?? [];

  return (
    <Card variant="premium" className="relative overflow-hidden p-5 sm:p-6">
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/70 to-transparent" />
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white inline-flex items-center justify-center shadow-wt-sm">
            <MapPin className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-ink">Saved addresses</h3>
            <p className="text-[11px] text-ink-4">Pickups and drop-offs you use often.</p>
          </div>
        </div>
        <Button
          type="button"
          onClick={() => (showForm ? resetForm() : setShowForm(true))}
          variant="subtle"
          size="sm"
          leftIcon={showForm ? <RefreshCw className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
        >
          {showForm ? "Cancel" : "Add address"}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-primary-200 bg-primary-50/30 p-4 mb-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className={fieldCls}>
                {Object.entries(ADDRESS_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>City</label>
              <select value={city} onChange={(e) => setCity(e.target.value)} className={fieldCls}>
                <option value="">Select city</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Address line 1</label>
            <input
              type="text"
              value={line1}
              onChange={(e) => setLine1(e.target.value)}
              placeholder="House no., street, area"
              className={fieldCls}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Address line 2 (optional)</label>
              <input
                type="text"
                value={line2}
                onChange={(e) => setLine2(e.target.value)}
                placeholder="Landmark, building"
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls}>Postal code</label>
              <input
                type="text"
                inputMode="numeric"
                value={postal}
                onChange={(e) => setPostal(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="PIN code"
                className={fieldCls}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="h-4 w-4 rounded border-ink-7 text-primary-600 focus:ring-primary-600/20 accent-[#F05A22]"
            />
            Set as my default address
          </label>
          <Button
            type="button"
            onClick={handleAdd}
            disabled={saving}
            variant="gradient-primary"
            size="md"
            shine
            leftIcon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          >
            Save address
          </Button>
        </div>
      )}

      {addresses.length === 0 && !showForm && (
        <div className="rounded-xl bg-gradient-to-br from-ink-9/40 to-white border border-ink-8 p-6 text-center">
          <div className="mx-auto h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white inline-flex items-center justify-center mb-2 shadow-wt-sm">
            <MapPin className="h-4 w-4" />
          </div>
          <p className="text-sm font-semibold text-ink">No saved addresses</p>
          <p className="text-xs text-ink-4 mt-1">Add a home or work address for faster booking.</p>
        </div>
      )}

      <ul className="space-y-2.5">
        {addresses.map((a) => (
          <AddressRow
            key={a.id}
            address={a}
            cityName={cityName}
            onSetDefault={() => handleSetDefault(a.id)}
            onDelete={() => handleDelete(a.id)}
          />
        ))}
      </ul>
    </Card>
  );
}

/* ========================================================================
 * AddressRow — single saved address with default / delete actions.
 * ====================================================================== */
function AddressRow({
  address,
  cityName,
  onSetDefault,
  onDelete,
}: {
  address: CustomerAddress;
  cityName: (id?: number | null) => string;
  onSetDefault: () => void;
  onDelete: () => void;
}) {
  const TypeIcon = address.address_type === "WORK" ? Briefcase : address.address_type === "OTHER" ? Star : Home;
  return (
    <li className="group rounded-xl border border-ink-8 bg-white px-4 py-3 flex items-start gap-3 transition-all duration-300 ease-[var(--ease-wt)] hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-wt-sm">
      <span className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white inline-flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:-rotate-3 transition-transform">
        <TypeIcon className="h-4 w-4" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wider text-gradient-primary">
            {ADDRESS_TYPE_LABELS[address.address_type ?? "OTHER"] ?? "Other"}
          </span>
          {address.is_default && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
              <Star className="h-2.5 w-2.5" /> Default
            </span>
          )}
        </div>
        <div className="text-sm text-ink mt-0.5">
          {[address.address_line_1, address.address_line_2].filter(Boolean).join(", ")}
        </div>
        {(cityName(address.city_id) !== "—" || address.postal_code) && (
          <div className="text-[11px] text-ink-4 mt-0.5">
            {cityName(address.city_id)}
            {address.postal_code ? ` · ${address.postal_code}` : ""}
          </div>
        )}
        <div className="mt-1.5 flex items-center gap-3">
          {!address.is_default && (
            <button
              type="button"
              onClick={onSetDefault}
              className="text-[11px] font-bold text-primary-600 hover:text-primary-700"
            >
              Set as default
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            className="text-[11px] font-bold text-red-600 hover:text-red-700 inline-flex items-center gap-1"
          >
            <Trash2 className="h-3 w-3" /> Delete
          </button>
        </div>
      </div>
    </li>
  );
}