"use client";

import {
  GoogleLogin,
  GoogleOAuthProvider,
  type CredentialResponse,
} from "@react-oauth/google";
import { useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-context-provider";
import { getApiErrorMessage } from "@/lib/api-error";

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export function GoogleSignInButton() {
  const { loginWithGoogle } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!googleClientId) {
    return (
      <p
        role="alert"
        className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
      >
        Google sign-in is not configured. Set{" "}
        <code className="font-mono text-xs">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code>{" "}
        in your environment.
      </p>
    );
  }

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      toast.error("Google did not return a credential. Please try again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await loginWithGoogle(credentialResponse.credential);
      toast.success(`Signed in as ${user.email}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <div
        aria-busy={isSubmitting}
        className={isSubmitting ? "pointer-events-none opacity-60" : undefined}
      >
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => toast.error("Google sign-in failed. Please try again.")}
          theme="filled_black"
          shape="rectangular"
          size="large"
          text="signin_with"
          width="320"
        />
      </div>
    </GoogleOAuthProvider>
  );
}
