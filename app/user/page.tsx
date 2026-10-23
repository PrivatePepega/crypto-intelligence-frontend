import type { Metadata } from "next";

import { UserAccount } from "@/components/auth/user-account";

export const metadata: Metadata = {
  title: "Your account | Crypto Intelligence Platform",
  description: "Sign in to your CryptoIntel account with Google.",
};

export default function UserPage() {
  return (
    <div className="py-12">
      <UserAccount />
    </div>
  );
}
