"use client";

/**
 * /profile — customer account page.
 *
 * Shows identity (name, customer code, referral, member-since) and contact
 * details, lets the customer edit personal details (first/last name, gender,
 * date of birth, city) and manage saved addresses (add / set default /
 * delete). Cross-account navigation comes from the shared AccountTabs shell.
 *
 * Doc Ref: API Doc — Customer endpoints (GET/PATCH /customers/me,
 * /customers/me/addresses)
 */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Tag,
  Loader2,
  Plus,
  Trash2,
  Star,
  ShieldCheck,
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
import PageHero from "@/components/sections/PageHero";
import AccountTabs, { accountTabs } from "@/components/layout/AccountTabs";
import {
  Avatar, Badge, Button, Card, Container, EmptyState, IconBox, Input, Section,
  Select, Skeleton, SkeletonText, MotionGlow,
} from "@/components/ui";

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

function errorMessage(e: unknown): string {
  const err = e as { response?: { data?: { message?: string; detail?: string } }; message?: string };
  return err?.response?.data?.message || err?.response?.data?.detail || err?.message || "Something went wrong";
}

export default function CustomerProfilePage() {
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
              <IconBox icon={<User />} tone="primary" size="xl" gradient glow className="mx-auto mb-4" />
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
    <>
      <PageHero
        eyebrow="Account"
        title="My Profile"
        accent="Profile"
        description="Keep your details current so the partner and the driver on your booking can reach you."
        bg="muted"
        overlay="dots-faint"
      />
      <AccountTabs items={accountTabs()} active="/profile" />

      <Section bg="white" pad="sm">
        <Container size="lg">
          {profileQuery.isLoading && (
            <div className="grid gap-5 sm:gap-6 lg:grid-cols-[340px_1fr]">
              <Card variant="premium" className="p-6">
                <Skeleton className="h-16 w-16 rounded-2xl" />
                <SkeletonText lines={4} className="mt-4" />
              </Card>
              <div className="space-y-5">
                <Card variant="premium" className="p-6">
                  <SkeletonText lines={7} />
                </Card>
                <Card variant="premium" className="p-6">
                  <SkeletonText lines={3} />
                </Card>
              </div>
            </div>
          )}

          {profileQuery.isError && (
            <EmptyState
              icon={<RefreshCw />}
              title="Couldn't load your profile"
              description={
                <>
                  {errorMessage(profileQuery.error)}
                  <span className="mt-1 block text-ink-4">
                    If your session expired, sign in again.
                  </span>
                </>
              }
              action={
                <Button
                  type="button"
                  variant="gradient-primary"
                  size="md"
                  shine
                  leftIcon={<RefreshCw className="h-4 w-4" />}
                  onClick={() => profileQuery.refetch()}
                >
                  Retry
                </Button>
              }
            />
          )}

          {profile && (
            <div className="grid gap-5 sm:gap-6 lg:grid-cols-[340px_1fr]">
              {/* ── Left rail ─────────────────────────────────── */}
              <aside className="space-y-5 self-start lg:sticky lg:top-24">
                <IdentityCard profile={profile} cityName={cityName} />
                <ContactCard profile={profile} />
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
        </Container>
      </Section>
    </>
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
  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <Card variant="premium" padded={false}>
      <div className="p-5">
        <div className="flex items-center gap-3">
          <Avatar name={fullName} size="lg" />
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold text-ink tracking-tight break-words leading-snug">
              {fullName}
            </h2>
            <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-ink-4">
              Customer · {profile.customer_code}
            </p>
          </div>
        </div>

        <dl className="mt-4 space-y-2 text-xs">
          {profile.referral_code && (
            <MetaRow icon={<Tag />} label="Referral code" value={profile.referral_code} />
          )}
          {profile.city_id != null && (
            <MetaRow icon={<MapPin />} label="City" value={cityName(profile.city_id)} />
          )}
          <MetaRow icon={<Calendar />} label="Member since" value={memberSince} />
        </dl>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-ink-8 px-5 py-3">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-4">
          <ShieldCheck className="h-3.5 w-3.5 text-ink-3" aria-hidden />
          Account status
        </span>
        <Badge tone={profile.is_active ? "success" : "warning"} size="sm" dot>
          {profile.is_active ? "Active" : "Inactive"}
        </Badge>
      </div>
    </Card>
  );
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-ink-4 [&>svg]:h-3.5 [&>svg]:w-3.5" aria-hidden>
        {icon}
      </span>
      <dt className="text-ink-4">{label}</dt>
      <dd className="ml-auto font-semibold text-ink-2 text-right break-words min-w-0">
        {value}
      </dd>
    </div>
  );
}

/* ========================================================================
 * ContactCard — mobile + email (read-only for now).
 * ====================================================================== */
function ContactCard({ profile }: { profile: CustomerProfile }) {
  const mobileDisplay =
    profile.mobile_number && !profile.mobile_number.startsWith("fb_")
      ? profile.mobile_number
      : "Not set";
  return (
    <Card variant="premium" padded={false}>
      <div className="p-5">
        <h3 className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-gradient-primary mb-4">
          Contact details
        </h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <IconBox icon={<Phone />} tone="primary" size="sm" />
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-ink-4">Mobile</div>
              <div className="text-sm font-semibold text-ink truncate">{mobileDisplay}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <IconBox icon={<Mail />} tone="info" size="sm" />
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-ink-4">Email</div>
              <div className="text-sm font-semibold text-ink truncate">{profile.email || "—"}</div>
            </div>
          </div>
        </div>
      </div>
      <p className="border-t border-ink-8 px-5 py-3 text-[11px] text-ink-4 leading-snug">
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
      <div className="flex items-center gap-3 mb-5">
        <IconBox icon={<User />} tone="primary" size="sm" />
        <div>
          <h3 className="text-sm font-extrabold text-ink">Personal details</h3>
          <p className="text-[11px] text-ink-4">How the partner and the driver on your booking address you.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="First name"
          required
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First name"
        />
        <Input
          label="Last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Last name"
        />
        <Select label="Gender" value={gender} onChange={(e) => setGender(e.target.value)}>
          <option value="">Select</option>
          {Object.entries(GENDER_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Input
          label="Date of birth"
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
        />
        <Select
          label="City"
          wrapperClassName="sm:col-span-2"
          value={cityId}
          onChange={(e) => setCityId(e.target.value)}
        >
          <option value="">Select city</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
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
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <IconBox icon={<MapPin />} tone="success" size="sm" />
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
            <Select
              label="Type"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {Object.entries(ADDRESS_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <Select
              label="City"
              wrapperClassName="sm:col-span-2"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            >
              <option value="">Select city</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <Input
            label="Address line 1"
            required
            value={line1}
            onChange={(e) => setLine1(e.target.value)}
            placeholder="House no., street, area"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Address line 2 (optional)"
              value={line2}
              onChange={(e) => setLine2(e.target.value)}
              placeholder="Landmark, building"
            />
            <Input
              label="Postal code"
              inputMode="numeric"
              value={postal}
              onChange={(e) => setPostal(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="PIN code"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="h-4 w-4 rounded border-ink-7 text-primary-600 focus:ring-primary-600/20 accent-primary-600"
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
        <EmptyState
          icon={<MapPin />}
          title="No saved addresses"
          description="Add a home or work address to reuse it on your next booking."
          className="m-0"
        />
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
      <IconBox icon={<TypeIcon />} tone="primary" size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wider text-gradient-primary">
            {ADDRESS_TYPE_LABELS[address.address_type ?? "OTHER"] ?? "Other"}
          </span>
          {address.is_default && (
            <Badge tone="success" size="sm" icon={<Star className="h-2.5 w-2.5" />}>
              Default
            </Badge>
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
        <div className="mt-2 flex items-center gap-2">
          {!address.is_default && (
            <button
              type="button"
              onClick={onSetDefault}
              className="rounded-lg px-2 py-1 text-[11px] font-bold text-primary-700 hover:bg-primary-50 transition-colors"
            >
              Set as default
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-danger hover:bg-danger-soft transition-colors"
          >
            <Trash2 className="h-3 w-3" /> Delete
          </button>
        </div>
      </div>
    </li>
  );
}