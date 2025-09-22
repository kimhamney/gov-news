"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const router = useRouter();
  useEffect(() => {
    supabase.auth.exchangeCodeForSession(window.location.href).finally(() => {
      router.replace("/");
    });
  }, [router]);
  return (
    <main className="min-h-[60vh] grid place-items-center">
      <div
        className="flex items-center gap-2 text-slate-600 text-sm"
        aria-live="polite"
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        Signing in…
      </div>
    </main>
  );
}
