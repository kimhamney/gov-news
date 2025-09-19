"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallback() {
  const router = useRouter();
  useEffect(() => {
    supabase.auth.exchangeCodeForSession(window.location.href).finally(() => {
      router.replace("/");
    });
  }, [router]);
  return <main className="mx-auto max-w-5xl p-4">Signing in...</main>;
}
