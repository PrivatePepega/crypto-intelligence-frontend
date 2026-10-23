"use client";

import { CalendarDays, LogOut, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { useAuth } from "@/components/providers/auth-context-provider";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api-error";

function formatMemberSince(createdAt?: string) {
  if (!createdAt) return null;

  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}

function UserAccountSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border bg-card p-8">
      <div className="size-12 rounded-full bg-muted" />
      <div className="mt-6 h-7 w-40 rounded bg-muted" />
      <div className="mt-3 h-4 w-full rounded bg-muted" />
      <div className="mt-2 h-4 w-2/3 rounded bg-muted" />
      <div className="mt-8 h-10 w-full rounded-md bg-muted" />
    </div>
  );
}

export function UserAccount() {
  const { user, isLoading, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      await signOut();
      toast.success("Signed out");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsSigningOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-md">
        <UserAccountSkeleton />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-md">
        <section className="rounded-xl border bg-card p-8 shadow-sm">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <UserRound className="size-6 text-muted-foreground" />
          </div>

          <h1 className="mt-6 text-2xl font-semibold tracking-tight">
            Sign in to CryptoIntel
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Sign in with your Google account to keep your watchlists, chat
            context, and research in one place.
          </p>

          <div className="mt-8 flex justify-center">
            <GoogleSignInButton />
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Your Google password is never shared with CryptoIntel.
          </p>
        </section>
      </div>
    );
  }

  const memberSince = formatMemberSince(user.createdAt);
  const initial = user.email.charAt(0).toUpperCase();

  return (
    <div className="mx-auto w-full max-w-md">
      <section className="rounded-xl border bg-card p-8 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted text-xl font-semibold">
            {initial}
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight">
              Your account
            </h1>

            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-3" />
              Signed in with Google
            </span>
          </div>
        </div>

        <dl className="mt-8 space-y-4">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Email
              </dt>
              <dd className="truncate text-sm">{user.email}</dd>
            </div>
          </div>

          {memberSince && (
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Member since
                </dt>
                <dd className="text-sm">{memberSince}</dd>
              </div>
            </div>
          )}
        </dl>

        <Button
          type="button"
          variant="outline"
          className="mt-8 w-full"
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          <LogOut className="size-4" />
          {isSigningOut ? "Signing out..." : "Sign out"}
        </Button>
      </section>
    </div>
  );
}
