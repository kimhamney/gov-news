"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ProfileTabs from "@/components/ProfileTabs";
import { ProfileSkeleton } from "@/components/Skeletons";

export default function MePage() {
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!mounted) return;
      console.debug("[/me] getUser()", {
        error,
        user: data.user?.id ?? null,
      });
      setUserId(data.user?.id ?? null);
      setReady(true);
    })();

    const sub = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      const next = session?.user?.id ?? null;
      console.debug("[/me] onAuthStateChange", { event, next });
      setUserId(next);
      setReady(true);
    });

    return () => {
      mounted = false;
      sub.data.subscription.unsubscribe();
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
        <div className="rounded-xl border p-6 text-sm text-slate-700">
          Please sign in to use this page.
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
