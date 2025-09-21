"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { User } from "lucide-react";
import { openAuthDialog } from "@/components/AuthModal";

export default function AuthButton() {
  const seedUid =
    typeof document !== "undefined" ? document.body.dataset.uid || null : null;
  const [ready, setReady] = useState<boolean>(!!seedUid);
  const [userId, setUserId] = useState<string | null>(seedUid);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!seedUid) {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setUserId(data?.session?.user?.id ?? null);
      }
      setReady(true);
    })();
    const sub = supabase.auth.onAuthStateChange((_e, s) => {
      if (!mounted) return;
      setUserId(s?.user?.id ?? null);
      setReady(true);
    });
    return () => {
      mounted = false;
      sub.data.subscription.unsubscribe();
    };
  }, [seedUid]);

  if (!ready) return null;

  if (!userId) {
    return (
      <button
        onClick={() => openAuthDialog("login")}
        className="px-3 h-9 rounded-xl bg-[var(--brand)] text-white text-xs font-medium hover:opacity-90 transition"
      >
        로그인
      </button>
    );
  }

  return (
    <Link
      href="/me"
      className="h-9 w-9 rounded-full bg-[var(--brand)] text-white grid place-items-center hover:opacity-90 transition"
      title="My profile"
      aria-label="My profile"
    >
      <User className="w-5 h-5" />
    </Link>
  );
}
