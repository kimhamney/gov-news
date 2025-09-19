"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useT } from "@/lib/i18n";
import { useLocaleMode } from "@/lib/localePref";

export default function AuthButton() {
  const t = useT();
  const { mode } = useLocaleMode();
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [nick, setNick] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      const u = data.user ?? null;
      if (!active) return;
      setUserId(u?.id ?? null);
      if (u) {
        const { data: p } = await supabase
          .from("profiles")
          .select("nickname,email")
          .eq("id", u.id)
          .maybeSingle();
        setNick(p?.nickname ?? p?.email ?? u.email ?? "");
      }
      setReady(true);
    };
    load();
    const sub = supabase.auth.onAuthStateChange(async (_e, session) => {
      const u = session?.user ?? null;
      setUserId(u?.id ?? null);
      if (u) {
        const { data: p } = await supabase
          .from("profiles")
          .select("nickname,email")
          .eq("id", u.id)
          .maybeSingle();
        setNick(p?.nickname ?? p?.email ?? u.email ?? "");
      } else {
        setNick(null);
      }
      setReady(true);
    });
    return () => {
      active = false;
      sub.data.subscription.unsubscribe();
    };
  }, []);

  const signIn = async () => {
    const origin = window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback` },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  if (!ready) return null;

  if (!userId)
    return (
      <button onClick={signIn} className="btn btn-ghost animate-fadeIn">
        {t("ui.login")}
      </button>
    );

  if (userId && !nick) return null;

  return (
    <div className="flex items-center gap-3 animate-fadeIn">
      <div className="hidden sm:block text-[11px] leading-4 text-slate-500 text-right">
        {mode === "en" ? `hi, ${nick}!` : `안녕하세요, ${nick}!`}
      </div>
      <Link
        href="/me"
        className="text-sm text-slate-700 hover:underline max-w-[140px] truncate"
      >
        {nick}
      </Link>
      <button onClick={signOut} className="btn btn-ghost">
        {t("ui.logout")}
      </button>
    </div>
  );
}
