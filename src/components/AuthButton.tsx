"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useT } from "@/lib/i18n";
import { User as UserIcon } from "lucide-react";

export default function AuthButton() {
  const t = useT();
  const seedUid =
    typeof document !== "undefined" ? document.body.dataset.uid || null : null;

  const [ready, setReady] = useState<boolean>(!!seedUid);
  const [userId, setUserId] = useState<string | null>(seedUid);

  useEffect(() => {
    let didInit = false;
    const sub = supabase.auth.onAuthStateChange(async (_event, session) => {
      didInit = true;
      const sid = session?.user?.id ?? null;
      setUserId(sid);
      setReady(true);
    });

    (async () => {
      if (seedUid) return;
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        setUserId(data.session.user.id);
        setReady(true);
      } else {
        setReady(true);
      }
      if (!didInit) {
        setTimeout(async () => {
          const { data: u } = await supabase.auth.getUser();
          if (u?.user?.id && !userId) setUserId(u.user.id);
        }, 0);
      }
    })();

    return () => {
      sub.data.subscription.unsubscribe();
    };
  }, [seedUid, userId]);

  const signIn = async () => {
    const origin = window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback` },
    });
  };

  if (!ready) return null;

  if (!userId) {
    return (
      <button onClick={signIn} className="btn btn-ghost animate-fadeIn">
        {t("ui.login")}
      </button>
    );
  }

  return (
    <Link
      href="/me"
      className="w-8 h-8 rounded-full bg-[var(--brand)] flex items-center justify-center hover:opacity-80 transition-opacity animate-fadeIn"
      aria-label="Go to profile"
      title="Go to profile"
    >
      <UserIcon className="w-5 h-5 text-white" />
    </Link>
  );
}
