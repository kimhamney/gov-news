"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { User } from "lucide-react";
import { openAuthDialog } from "@/components/AuthModal";

export default function AuthButton() {
  const seedUid =
    typeof document !== "undefined" ? document.body.dataset.uid || null : null;

  const [ready, setReady] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let readyTimer: any;

    console.log("[AuthButton] INIT - Starting auth resolution", {
      seedUid,
      timestamp: new Date().toISOString(),
    });

    const resolveUserFast = async () => {
      if (seedUid && mounted) {
        console.log("[AuthButton] STEP 1 - Using seedUid", { seedUid });
        setUserId(seedUid);
        setReady(true);
        return;
      }

      console.log("[AuthButton] STEP 2 - No seedUid, trying getUser()");
      const { data: u1, error: e1 } = await supabase.auth.getUser();
      console.log("[AuthButton] STEP 2 - getUser() result", {
        userId: u1?.user?.id,
        error: e1?.message,
        mounted,
      });

      if (!mounted) return;
      if (u1?.user?.id) {
        console.log("[AuthButton] STEP 2 - SUCCESS - User found via getUser()");
        setUserId(u1.user.id);
        setReady(true);
        return;
      }

      console.log(
        "[AuthButton] STEP 3 - getUser() failed, trying getSession()"
      );
      const { data: s, error: e2 } = await supabase.auth.getSession();
      console.log("[AuthButton] STEP 3 - getSession() result", {
        userId: s?.session?.user?.id,
        error: e2?.message,
        mounted,
      });

      if (!mounted) return;
      if (s?.session?.user?.id) {
        console.log(
          "[AuthButton] STEP 3 - SUCCESS - User found via getSession()"
        );
        setUserId(s.session.user.id);
      } else {
        console.log("[AuthButton] STEP 3 - FAILED - No user found in session");
      }

      console.log("[AuthButton] FINAL - Setting ready to true", {
        finalUserId: s?.session?.user?.id || null,
      });
      setReady(true);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      const nextId = session?.user?.id ?? null;
      console.log("[AuthButton] AUTH_STATE_CHANGE", {
        event,
        nextId,
        previousUserId: userId,
        timestamp: new Date().toISOString(),
      });
      setUserId(nextId);
      setReady(true);
    });

    readyTimer = setTimeout(() => {
      if (!mounted) return;
      console.log("[AuthButton] TIMEOUT - Force setting ready", {
        currentUserId: userId,
        timestamp: new Date().toISOString(),
      });
      setReady(true);
    }, 1500);

    const recheck = () => {
      console.log("[AuthButton] RECHECK - Window focus/visibility change");
      supabase.auth.getUser().then(({ data, error }) => {
        if (!mounted) return;
        console.log("[AuthButton] RECHECK - Result", {
          userId: data?.user?.id,
          error: error?.message,
        });
        if (data?.user?.id) setUserId(data.user.id);
      });
    };

    window.addEventListener("focus", recheck);
    const vis = () => {
      if (!document.hidden) recheck();
    };
    document.addEventListener("visibilitychange", vis);

    resolveUserFast();

    return () => {
      console.log("[AuthButton] CLEANUP");
      mounted = false;
      clearTimeout(readyTimer);
      sub?.subscription?.unsubscribe?.();
      window.removeEventListener("focus", recheck);
      document.removeEventListener("visibilitychange", vis);
    };
  }, [seedUid]);

  if (!ready) {
    return <div className="h-9 w-20 rounded-xl bg-slate-100 animate-pulse" />;
  }

  if (!userId) {
    return (
      <button
        onClick={() => {
          console.log("[AuthButton] openAuthDialog(login)");
          openAuthDialog("login");
        }}
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
      onClick={() => console.log("[AuthButton] go to /me", { userId })}
    >
      <User className="w-5 h-5" />
    </Link>
  );
}
