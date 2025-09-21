"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabaseClient";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  X,
  Chrome,
} from "lucide-react";

type Tab = "login" | "signup";

export function openAuthDialog(tab: Tab = "login") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("auth:open", { detail: { tab } }));
}

export default function AuthModal() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("login");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPwd, setLoginPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginMsg, setLoginMsg] = useState("");

  const [signupEmail, setSignupEmail] = useState("");
  const [signupBusy, setSignupBusy] = useState(false);
  const [signupSent, setSignupSent] = useState(false);
  const [signupMsg, setSignupMsg] = useState("");

  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const ev = e as CustomEvent<{ tab?: Tab }>;
      setTab(ev.detail?.tab ?? "login");
      setOpen(true);
      setLoginMsg("");
      setSignupMsg("");
      setSignupSent(false);
    };
    const onClose = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("auth:open", onOpen as EventListener);
    window.addEventListener("auth:close", onClose);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("auth:open", onOpen as EventListener);
      window.removeEventListener("auth:close", onClose);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const title = useMemo(
    () => (tab === "login" ? "Login to your account" : "Create your account"),
    [tab]
  );

  const signInEmailPassword = async () => {
    setLoginBusy(true);
    setLoginMsg("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPwd,
      });
      if (error) throw error;
      if (!data?.user) throw new Error("No user");
      setOpen(false);
      setLoginEmail("");
      setLoginPwd("");
    } catch (e: any) {
      setLoginMsg(e?.message ?? "Failed to sign in.");
    } finally {
      setLoginBusy(false);
    }
  };

  const sendRecovery = async () => {
    if (!loginEmail.trim()) {
      setLoginMsg("Enter your email first.");
      return;
    }
    try {
      const origin = window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(
        loginEmail.trim(),
        {
          redirectTo: `${origin}/auth/callback`,
        }
      );
      if (error) throw error;
      setLoginMsg("Check your email to reset password.");
    } catch (e: any) {
      setLoginMsg(e?.message ?? "Failed to send recovery email.");
    }
  };

  const signInGoogle = async () => {
    const origin = window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback` },
    });
  };

  const sendSignupLink = async () => {
    if (!signupEmail.trim()) return;
    setSignupBusy(true);
    setSignupMsg("");
    try {
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOtp({
        email: signupEmail.trim(),
        options: { emailRedirectTo: `${origin}/auth/callback` },
      });
      if (error) throw error;
      setSignupSent(true);
      setSignupMsg("Check your email to complete sign-up.");
    } catch (e: any) {
      setSignupMsg(e?.message ?? "Failed to send sign-up link.");
    } finally {
      setSignupBusy(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] grid place-items-center bg-black/40 supports-[backdrop-filter]:backdrop-blur-lg backdrop-blur-md"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div
        ref={panelRef}
        className="w-[min(92vw,440px)] rounded-3xl bg-white/95 shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="px-6 sm:px-7 pt-5 pb-6">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold tracking-tight text-slate-900">
              {title}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="h-8 w-8 grid place-items-center rounded-lg hover:bg-slate-100"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          <div className="mt-4 mb-1 grid place-items-center">
            <div className="font-black tracking-tight text-[26px] italic text-[var(--brand)]">
              GOVNEWS
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100">
              <button
                onClick={() => setTab("login")}
                className={`flex-1 px-3 py-1.5 rounded-xl text-xs ${
                  tab === "login" ? "bg-white shadow" : "opacity-70"
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setTab("signup")}
                className={`flex-1 px-3 py-1.5 rounded-xl text-xs ${
                  tab === "signup" ? "bg-white shadow" : "opacity-70"
                }`}
              >
                Sign up
              </button>
            </div>

            {tab === "login" ? (
              <>
                <div className="mt-4 grid gap-2">
                  <label
                    className="flex items-center gap-2 rounded-xl border px-3 h-10 text-[13px] focus-within:ring-2 focus-within:ring-slate-200"
                    style={{ borderColor: "var(--line)" }}
                  >
                    <Mail className="w-4 h-4 text-slate-500" />
                    <input
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="Email address"
                      className="flex-1 outline-none bg-transparent"
                    />
                  </label>
                  <label
                    className="flex items-center gap-2 rounded-xl border px-3 h-10 text-[13px] focus-within:ring-2 focus-within:ring-slate-200"
                    style={{ borderColor: "var(--line)" }}
                  >
                    <Lock className="w-4 h-4 text-slate-500" />
                    <input
                      value={loginPwd}
                      onChange={(e) => setLoginPwd(e.target.value)}
                      type={showPwd ? "text" : "password"}
                      placeholder="Password"
                      className="flex-1 outline-none bg-transparent"
                    />
                    <button
                      onClick={() => setShowPwd((v) => !v)}
                      className="h-7 w-7 grid place-items-center rounded-md hover:bg-slate-100"
                    >
                      {showPwd ? (
                        <EyeOff className="w-4 h-4 text-slate-500" />
                      ) : (
                        <Eye className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                  </label>
                  <button
                    onClick={sendRecovery}
                    className="self-start text-[12px] text-[var(--brand)] hover:opacity-80"
                  >
                    Forgot password?
                  </button>
                </div>

                {loginMsg && (
                  <div className="mt-2 text-[12px] text-slate-700">
                    {loginMsg}
                  </div>
                )}

                <button
                  onClick={signInEmailPassword}
                  disabled={loginBusy}
                  className="mt-4 w-full h-10 rounded-xl bg-slate-900 text-white text-xs inline-flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60"
                >
                  {loginBusy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  Continue
                </button>

                <div className="mt-4 text-[12px] text-slate-600">
                  Don’t have an account?{" "}
                  <button
                    onClick={() => setTab("signup")}
                    className="text-[var(--brand)] hover:opacity-80"
                  >
                    Sign up
                  </button>
                </div>

                <div className="my-4 flex items-center gap-3 text-[11px] text-slate-400">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span>OR</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <button
                  onClick={signInGoogle}
                  className="h-10 w-full rounded-xl border bg-white hover:bg-slate-50 text-[12px] inline-flex items-center justify-center gap-2"
                  style={{ borderColor: "var(--line)" }}
                >
                  <Chrome className="w-4 h-4" />
                  Continue with Google
                </button>
              </>
            ) : (
              <>
                <div className="mt-4 grid gap-2">
                  <label
                    className="flex items-center gap-2 rounded-xl border px-3 h-10 text-[13px] focus-within:ring-2 focus-within:ring-slate-200"
                    style={{ borderColor: "var(--line)" }}
                  >
                    <Mail className="w-4 h-4 text-slate-500" />
                    <input
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="Email address"
                      className="flex-1 outline-none bg-transparent"
                    />
                  </label>
                </div>
                {signupMsg && (
                  <div className="mt-2 text-[12px] text-slate-700">
                    {signupMsg}
                  </div>
                )}
                <button
                  onClick={sendSignupLink}
                  disabled={signupBusy || signupSent}
                  className="mt-4 w-full h-10 rounded-xl bg-[var(--brand)] text-white text-xs inline-flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60"
                >
                  {signupBusy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  Send sign-up link
                </button>
                <div className="mt-4 text-[12px] text-slate-600">
                  Already have an account?{" "}
                  <button
                    onClick={() => setTab("login")}
                    className="text-[var(--brand)] hover:opacity-80"
                  >
                    Login
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
