"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CameraIcon,
  CheckCircle2Icon,
  Loader2Icon,
  PencilIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { accountInitials } from "@/lib/auth/account";
import { formatDate } from "@/lib/format";

type ProfileResponse = {
  ok?: boolean;
  message?: string;
  error?: string;
  details?: Record<string, string[]>;
  avatarUrl?: string;
  emailChangePending?: string | null;
  emailDelivered?: boolean;
};

export type ProfileFormUser = {
  name: string;
  email: string;
  phone: string | null;
  pendingEmail: string | null;
  emailVerified: boolean;
  createdAt: string;
  avatarUrl: string | null;
};

function Alert({
  tone,
  children,
}: {
  tone: "success" | "error";
  children: React.ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      aria-live="polite"
      className={`rounded-lg border px-4 py-3 text-sm ${
        tone === "error"
          ? "border-destructive/30 bg-destructive/5 text-destructive"
          : "border-border bg-muted/40 text-foreground"
      }`}
    >
      {children}
    </div>
  );
}

export function ProfileForm({
  user,
  emailChanged = false,
}: {
  user: ProfileFormUser;
  emailChanged?: boolean;
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [pendingEmail, setPendingEmail] = useState(user.pendingEmail);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);

  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(
    emailChanged ? "Email address updated successfully." : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  function resetForm() {
    setName(user.name);
    setEmail(user.email);
    setPhone(user.phone ?? "");
    setFieldErrors({});
    setError(null);
    setEditing(false);
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("profile");
    setMessage(null);
    setError(null);
    setFieldErrors({});

    try {
      const response = await fetch("/api/auth/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone }),
      });
      const data = (await response.json().catch(() => ({}))) as ProfileResponse;

      if (!response.ok) {
        setFieldErrors(data.details ?? {});
        setError(data.error ?? "Your profile could not be saved.");
        return;
      }

      setPendingEmail(data.emailChangePending ?? null);
      setMessage(data.message ?? "Profile saved.");
      setEditing(false);
      setEmail(user.email);
      router.refresh();
    } catch {
      setError("We could not reach the server. Check your connection and retry.");
    } finally {
      setBusy(null);
    }
  }

  async function uploadAvatar(file: File) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setError("Upload a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Profile photos must be 2 MB or smaller.");
      return;
    }

    setBusy("avatar");
    setError(null);
    setMessage(null);

    try {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch("/api/auth/account/avatar", {
        method: "POST",
        body,
      });
      const data = (await response.json().catch(() => ({}))) as ProfileResponse;

      if (!response.ok) {
        setError(data.error ?? "The photo could not be saved.");
        return;
      }

      if (data.avatarUrl) setAvatarUrl(data.avatarUrl);
      setMessage(data.message ?? "Profile photo updated.");
      toast.success("Profile photo updated.");
      router.refresh();
    } catch {
      setError("We could not reach the server. Check your connection and retry.");
    } finally {
      setBusy(null);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function removeAvatar() {
    setBusy("avatar");
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/account/avatar", {
        method: "DELETE",
      });
      const data = (await response.json().catch(() => ({}))) as ProfileResponse;

      if (!response.ok) {
        setError(data.error ?? "The photo could not be removed.");
        return;
      }

      setAvatarUrl(null);
      setMessage(data.message ?? "Profile photo removed.");
      router.refresh();
    } catch {
      setError("We could not reach the server. Check your connection and retry.");
    } finally {
      setBusy(null);
    }
  }

  async function changePendingEmail(action: "resend" | "cancel") {
    setBusy(action);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/account/email", {
        method: action === "cancel" ? "DELETE" : "POST",
      });
      const data = (await response.json().catch(() => ({}))) as ProfileResponse;

      if (!response.ok) {
        setError(data.error ?? "The email change could not be updated.");
        return;
      }

      if (action === "cancel") {
        setPendingEmail(null);
        setEmail(user.email);
      }
      setMessage(data.message ?? "Email change updated.");
      router.refresh();
    } catch {
      setError("We could not reach the server. Check your connection and retry.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {message ? <Alert tone="success">{message}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}

      <section className="rounded-xl border border-border bg-background p-5">
        <h2 className="font-semibold">Profile photo</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This photo appears beside your name throughout ONO.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Avatar className="size-16">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
            <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
              {accountInitials(name, user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadAvatar(file);
              }}
            />
            <Button
              type="button"
              variant="outline"
              disabled={busy !== null}
              onClick={() => fileInput.current?.click()}
            >
              {busy === "avatar" ? (
                <Loader2Icon className="animate-spin" aria-hidden="true" />
              ) : (
                <CameraIcon aria-hidden="true" />
              )}
              {avatarUrl ? "Replace photo" : "Upload photo"}
            </Button>
            {avatarUrl ? (
              <Button
                type="button"
                variant="ghost"
                disabled={busy !== null}
                onClick={() => void removeAvatar()}
              >
                <Trash2Icon aria-hidden="true" />
                Remove
              </Button>
            ) : null}
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          JPG, PNG or WebP · 2 MB maximum.
        </p>
      </section>

      <section className="rounded-xl border border-border bg-background p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">Personal information</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your name, email address and contact number.
            </p>
          </div>
          {!editing ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditing(true);
                setMessage(null);
                setError(null);
              }}
            >
              <PencilIcon aria-hidden="true" />
              Edit Profile
            </Button>
          ) : null}
        </div>

        {editing ? (
          <form className="mt-4 grid gap-4" onSubmit={saveProfile}>
            <label className="grid gap-1.5 text-sm font-medium">
              Full name
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                maxLength={80}
                required
                aria-invalid={Boolean(fieldErrors.name)}
              />
              {fieldErrors.name ? (
                <span className="text-xs font-normal text-destructive">
                  {fieldErrors.name[0]}
                </span>
              ) : null}
            </label>

            <label className="grid gap-1.5 text-sm font-medium">
              Email address
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                maxLength={254}
                required
                aria-invalid={Boolean(fieldErrors.email)}
              />
              {fieldErrors.email ? (
                <span className="text-xs font-normal text-destructive">
                  {fieldErrors.email[0]}
                </span>
              ) : null}
              <span className="text-xs font-normal text-muted-foreground">
                Changing this address sends a confirmation link to the new
                mailbox. Your current address stays active until you confirm.
              </span>
            </label>

            <label className="grid gap-1.5 text-sm font-medium">
              Phone number
              <Input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                autoComplete="tel"
                maxLength={32}
                placeholder="+255 700 000 000"
                aria-invalid={Boolean(fieldErrors.phone)}
              />
              {fieldErrors.phone ? (
                <span className="text-xs font-normal text-destructive">
                  {fieldErrors.phone[0]}
                </span>
              ) : null}
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit" disabled={busy !== null}>
                {busy === "profile" ? (
                  <Loader2Icon className="animate-spin" aria-hidden="true" />
                ) : (
                  <CheckCircle2Icon aria-hidden="true" />
                )}
                Save Changes
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy !== null}
                onClick={resetForm}
              >
                <XIcon aria-hidden="true" />
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <dt className="text-xs font-medium text-muted-foreground">
                Full name
              </dt>
              <dd className="mt-1 truncate text-sm font-medium">{name}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs font-medium text-muted-foreground">
                Email address
              </dt>
              <dd className="mt-1 flex flex-wrap items-center gap-2 text-sm font-medium">
                <span className="truncate">{email}</span>
                <span
                  className={
                    user.emailVerified
                      ? "text-xs font-normal text-emerald-700 dark:text-emerald-400"
                      : "text-xs font-normal text-warning"
                  }
                >
                  {user.emailVerified ? "Verified" : "Not verified"}
                </span>
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs font-medium text-muted-foreground">
                Phone number
              </dt>
              <dd className="mt-1 truncate text-sm font-medium">
                {phone || "Not added"}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs font-medium text-muted-foreground">
                Account created
              </dt>
              <dd className="mt-1 text-sm font-medium">
                {formatDate(user.createdAt)}
              </dd>
            </div>
          </dl>
        )}

        {pendingEmail ? (
          <div className="mt-5 rounded-lg border border-warning/30 bg-warning/5 p-4">
            <p className="text-sm font-medium">
              Waiting for confirmation: {pendingEmail}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Your current address remains active until the new mailbox is
              confirmed.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy !== null}
                onClick={() => void changePendingEmail("resend")}
              >
                {busy === "resend" ? (
                  <Loader2Icon className="animate-spin" aria-hidden="true" />
                ) : null}
                Resend confirmation
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={busy !== null}
                onClick={() => void changePendingEmail("cancel")}
              >
                {busy === "cancel" ? (
                  <Loader2Icon className="animate-spin" aria-hidden="true" />
                ) : null}
                Cancel change
              </Button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
