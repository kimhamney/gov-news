"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Profile } from "@/types/profile";
import { useT } from "@/lib/i18n";

export default function Onboarding() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");

  const [pwd1, setPwd1] = useState("");
  const [pwd2, setPwd2] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      try {
        const seedUid =
          typeof document !== "undefined"
            ? document.body.dataset.uid || null
            : null;

        let currentUser = null;

        if (seedUid) {
          const { data } = await supabase.auth.getUser();
          currentUser = data.user;
        } else {
          const { data } = await supabase.auth.getUser();
          currentUser = data.user;
        }

        if (!mounted) return;

        if (!currentUser) {
          setOpen(false);
          setLoading(false);
          return;
        }

        setUserId(currentUser.id);
        setEmail(currentUser.email ?? "");

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .maybeSingle<Profile>();

        if (!mounted) return;

        setOpen(!profile);
        setLoading(false);
      } catch (error) {
        console.error("[Onboarding] Boot error:", error);
        if (mounted) {
          setOpen(false);
          setLoading(false);
        }
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!mounted) return;

      const u = s?.user;
      if (!u) {
        setOpen(false);
        setUserId(null);
        return;
      }

      console.log("[Onboarding] Auth state changed:", u.id);
      setUserId(u.id);
      setEmail(u.email ?? "");

      if (!loading) {
        supabase
          .from("profiles")
          .select("*")
          .eq("id", u.id)
          .maybeSingle<Profile>()
          .then(({ data: profile }) => {
            if (mounted) setOpen(!profile);
          });
      }
    });

    boot();

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, [loading]);

  const submit = async () => {
    if (!userId) return;
    setError(null);

    const nk = nickname.trim();
    const em = email.trim();

    if (nk.length < 2 || nk.length > 20) {
      setError("Please enter a nickname of 2–20 characters.");
      return;
    }

    if (!em || !/\S+@\S+\.\S+/.test(em)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (pwd1.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (pwd1 !== pwd2) {
      setError("Passwords do not match.");
      return;
    }

    setSaving(true);

    try {
      if (pwd1) {
        const { error: pwdError } = await supabase.auth.updateUser({
          password: pwd1,
        });
        if (pwdError) throw pwdError;
      }

      if (em !== email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: em,
        });
        if (emailError) throw emailError;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .insert({ id: userId, nickname: nk, email: em });

      if (profileError) throw profileError;

      console.log("[Onboarding] Profile created successfully");
      setOpen(false);
      window.dispatchEvent(new Event("profile:created"));
    } catch (error: any) {
      console.error("[Onboarding] Submit error:", error);

      let errorMsg = "Failed to create profile. Please try again.";
      if (error?.message) {
        if (
          error.message.includes("duplicate") ||
          error.message.includes("unique")
        ) {
          errorMsg = "This email or nickname is already in use.";
        } else if (error.message.includes("invalid")) {
          errorMsg = "Invalid information provided. Please check your inputs.";
        } else {
          errorMsg = error.message;
        }
      }

      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      submit();
    }
  };

  if (loading || !open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="text-center space-y-2">
            <div className="text-xl font-bold">{t("ui.welcome")}</div>
            <div className="text-sm text-slate-600">
              {t("ui.setNicknameEmail")}
            </div>
          </div>

          <div className="space-y-3">
            <label className="block">
              <span className="block text-xs text-slate-600 mb-1">
                {t("ui.nickname")}
              </span>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g., hailey"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-200"
                autoFocus
              />
            </label>

            <label className="block">
              <span className="block text-xs text-slate-600 mb-1">
                {t("ui.email")}
              </span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="example@email.com"
                type="email"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-200"
              />
            </label>

            <div className="space-y-2">
              <label className="block">
                <span className="block text-xs text-slate-600 mb-1">
                  {t("ui.newPassword") ?? "New password"}
                </span>
                <input
                  value={pwd1}
                  onChange={(e) => setPwd1(e.target.value)}
                  onKeyDown={handleKeyDown}
                  type="password"
                  placeholder="••••••"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-200"
                />
              </label>

              <label className="block">
                <span className="block text-xs text-slate-600 mb-1">
                  {t("ui.confirmPassword") ?? "Confirm password"}
                </span>
                <input
                  value={pwd2}
                  onChange={(e) => setPwd2(e.target.value)}
                  onKeyDown={handleKeyDown}
                  type="password"
                  placeholder="••••••"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-200"
                />
              </label>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
                {error}
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={submit}
                disabled={
                  saving || !nickname.trim() || !email.trim() || !pwd1 || !pwd2
                }
                className="flex-1 rounded-xl bg-slate-900 text-white py-2 text-sm hover:opacity-90 disabled:opacity-60 transition-opacity"
              >
                {saving ? t("ui.saving") : t("ui.save")}
              </button>
            </div>

            <div className="text-xs text-slate-500 text-center">
              Press Ctrl+Enter to submit quickly
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
