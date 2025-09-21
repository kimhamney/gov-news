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
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      if (!mounted) return;
      if (!u) {
        setOpen(false);
        setLoading(false);
        return;
      }
      setUserId(u.id);
      setEmail(u.email ?? "");
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", u.id)
        .maybeSingle<Profile>();
      if (!mounted) return;
      setOpen(!profile);
      setLoading(false);
    };
    boot();
    const sub = supabase.auth.onAuthStateChange((_e, s) => {
      const u = s?.user;
      if (!u) {
        setOpen(false);
        setUserId(null);
        return;
      }
      setUserId(u.id);
      setEmail(u.email ?? "");
    });
    return () => {
      sub.data.subscription.unsubscribe();
      mounted = false;
    };
  }, []);

  const submit = async () => {
    if (!userId) return;
    setError(null);

    const nk = nickname.trim();
    const em = email.trim();
    if (nk.length < 2 || nk.length > 20) {
      setError("Please enter a nickname of 2–20 characters.");
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
    const upPwd = await supabase.auth.updateUser({ password: pwd1 });
    if (upPwd.error) {
      setSaving(false);
      setError(upPwd.error.message);
      return;
    }

    const upProfile = await supabase
      .from("profiles")
      .insert({ id: userId, nickname: nk, email: em });

    if (upProfile.error) {
      setSaving(false);
      setError(upProfile.error.message);
      return;
    }

    setSaving(false);
    setOpen(false);
    window.dispatchEvent(new Event("profile:created"));
  };

  if (loading || !open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-6 space-y-2">
          <div className="text-xl font-bold">{t("ui.welcome")}</div>
          <div className="text-sm text-slate-600">
            {t("ui.setNicknameEmail")}
          </div>
          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="block text-xs text-slate-600 mb-1">
                {t("ui.nickname")}
              </span>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="e.g., hailey"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-200"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-slate-600 mb-1">
                {t("ui.email")}
              </span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-200"
              />
            </label>

            <div className="mt-2 grid gap-2">
              <label className="block">
                <span className="block text-xs text-slate-600 mb-1">
                  {t("ui.newPassword") ?? "New password"}
                </span>
                <input
                  value={pwd1}
                  onChange={(e) => setPwd1(e.target.value)}
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
                  type="password"
                  placeholder="••••••"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-200"
                />
              </label>
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}

            <button
              onClick={submit}
              disabled={saving}
              className="w-full mt-2 rounded-xl bg-slate-900 text-white py-2 text-sm hover:opacity-90 disabled:opacity-60"
            >
              {saving ? t("ui.saving") : t("ui.save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
