"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ProfileTabs from "@/components/ProfileTabs";
import { ProfileSkeleton } from "@/components/Skeletons";
import { openAuthDialog } from "@/components/AuthModal";

export default function MePage() {
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    console.log("[/me] INIT - Starting auth resolution", {
      timestamp: new Date().toISOString(),
    });

    const resolveAuth = async () => {
      try {
        const seedUid =
          typeof document !== "undefined"
            ? document.body.dataset.uid || null
            : null;

        console.log("[/me] STEP 1 - Checking seedUid", { seedUid });

        if (seedUid && mounted) {
          console.log("[/me] STEP 1 - SUCCESS - Using server seedUid");
          setUserId(seedUid);
          setReady(true);
          return;
        }

        console.log("[/me] STEP 2 - No seedUid, trying getUser()");
        const { data, error } = await supabase.auth.getUser();

        console.log("[/me] STEP 2 - getUser() result", {
          error: error?.message,
          userId: data.user?.id ?? null,
          mounted,
        });

        if (!mounted) return;

        const userId = data.user?.id ?? null;
        setUserId(userId);
        setReady(true);

        if (userId) {
          console.log("[/me] STEP 2 - SUCCESS - User authenticated");
        } else {
          console.log("[/me] STEP 2 - FAILED - No user found");
        }
      } catch (error) {
        console.error(
          "[/me] AUTH_ERROR - Exception during auth resolution:",
          error
        );
        if (mounted) {
          setUserId(null);
          setReady(true);
        }
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      const next = session?.user?.id ?? null;
      console.log("[/me] AUTH_STATE_CHANGE", {
        event,
        next,
        previousUserId: userId,
        timestamp: new Date().toISOString(),
      });
      setUserId(next);
      setReady(true);
    });

    resolveAuth();

    return () => {
      console.log("[/me] CLEANUP");
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  if (!ready) {
    return (
      <main className="mx-auto max-w-5xl p-4">
        <ProfileSkeleton />
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="mx-auto max-w-5xl p-4">
        <div className="rounded-xl border border-slate-200 p-6 text-center space-y-4">
          <div className="text-sm text-slate-700">
            Please sign in to access your profile.
          </div>
          <button
            onClick={() => openAuthDialog("login")}
            className="px-4 py-2 rounded-xl bg-[var(--brand)] text-white text-sm hover:opacity-90 transition"
          >
            Sign In
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl p-4">
      <ProfileTabs />
    </main>
  );
}
