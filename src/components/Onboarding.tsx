"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Profile } from "@/types/profile";
import { useT } from "@/lib/i18n";

export default function Onboarding() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(async ({ data }) => {
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
    });
    const sub = supabase.auth.onAuthStateChange(async (_e, session) => {
      const u = session?.user;
      if (!u) {
        setOpen(false);
        setUserId(null);
        return;
      }
      setUserId(u.id);
      setEmail(u.email ?? "");
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", u.id)
        .maybeSingle<Profile>();
      setOpen(!profile);
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
    setSaving(true);
    const { error: insertErr } = await supabase
      .from("profiles")
      .insert({ id: userId, nickname: nk, email: em });
    if (insertErr) {
      setError(insertErr.message);
      setSaving(false);
      return;
    }
    setSaving(false);
    setOpen(false);
    window.dispatchEvent(new Event("profile:created"));
  };

  if (loading) return null;
  if (!open) return null;

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
