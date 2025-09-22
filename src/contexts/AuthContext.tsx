"use client";
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

interface AuthContextType {
  userId: string | null;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  userId: null,
  loading: true,
  isAuthenticated: false,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    let mounted = true;

    console.log("[AuthProvider] INIT - Starting global auth resolution");

    const resolveAuth = async () => {
      try {
        const seedUid =
          typeof document !== "undefined"
            ? document.body.dataset.uid || null
            : null;

        if (seedUid && mounted) {
          console.log("[AuthProvider] SUCCESS - Using seedUid", { seedUid });
          setUserId(seedUid);
          setLoading(false);
          return;
        }

        console.log("[AuthProvider] Calling getUser() with timeout");

        const timeoutPromise = new Promise<{
          data: { user: null };
          error: any;
        }>((_, reject) =>
          setTimeout(() => reject(new Error("getUser timeout")), 5000)
        );

        const authPromise = supabase.auth.getUser();

        const { data, error } = await Promise.race([
          authPromise,
          timeoutPromise,
        ]);

        console.log("[AuthProvider] getUser() result", {
          userId: data?.user?.id,
          error: error?.message,
        });

        if (mounted) {
          setUserId(data?.user?.id ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error("[AuthProvider] Auth resolution error:", error);
        if (mounted) {
          setUserId(null);
          setLoading(false);
        }
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      const nextUserId = session?.user?.id ?? null;
      console.log("[AuthProvider] AUTH_STATE_CHANGE", {
        event,
        nextUserId,
        previousUserId: userId,
      });

      setUserId(nextUserId);

      if (loading) {
        setLoading(false);
      }
    });

    resolveAuth();

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  const value = {
    userId,
    loading,
    isAuthenticated: !!userId,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
