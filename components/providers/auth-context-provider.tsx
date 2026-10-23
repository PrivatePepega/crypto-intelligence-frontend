"use client";

import axios from "axios";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { fetchData, postData } from "@/lib/fetch-util";
import type { AuthUser } from "@/types";
import { authResponseSchema } from "@/types/zodSchemas";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginWithGoogle: (credential: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore the session from the httpOnly cookie on every page load.
  useEffect(() => {
    let cancelled = false;

    const loadCurrentUser = async () => {
      try {
        const response = await fetchData<unknown>("/authMe");
        const { user: currentUser } = authResponseSchema.parse(response);

        if (!cancelled) {
          setUser(currentUser);
        }
      } catch (error) {
        if (cancelled) return;

        setUser(null);

        const isUnauthorized =
          axios.isAxiosError(error) && error.response?.status === 401;

        if (!isUnauthorized) {
          console.error("Could not load the current user:", error);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, []);

  // The API client emits this event when any request reports an expired session.
  useEffect(() => {
    const handleForceLogout = () => setUser(null);

    window.addEventListener("force-logout", handleForceLogout);

    return () => window.removeEventListener("force-logout", handleForceLogout);
  }, []);

  const loginWithGoogle = useCallback(async (credential: string) => {
    const response = await postData<unknown>("/auth/login", { credential });
    const { user: signedInUser } = authResponseSchema.parse(response);

    setUser(signedInUser);

    return signedInUser;
  }, []);

  const signOut = useCallback(async () => {
    await postData<{ message: string }>("/auth/signout", {});
    setUser(null);
  }, []);

  const values = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      loginWithGoogle,
      signOut,
    }),
    [user, isLoading, loginWithGoogle, signOut]
  );

  return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
