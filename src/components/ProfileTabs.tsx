"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Profile } from "@/types/profile";
import { Article } from "@/types/article";
import Link from "next/link";
import { useT } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { useScrap } from "@/contexts/ScrapContext";
import { useAuth } from "@/contexts/AuthContext";

type ScrapRow = { article_id: string; created_at: string };

export default function ProfileTabs() {
  const t = useT();
  const router = useRouter();
  const { resetFromDb } = useScrap();
  const { userId, loading } = useAuth();

  const [tab, setTab] = useState<"profile" | "scraps" | "replies">("profile");
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [scraps, setScraps] = useState<Article[]>([]);
  const [loadingScraps, setLoadingScraps] = useState(false);

  const [replies, setReplies] = useState<
    Array<{ id: string; article_id: string; body: string; created_at: string }>
  >([]);
  const [loadingReplies, setLoadingReplies] = useState(false);

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      if (!userId) return;
      try {
        const [{ data: u }, { data: p }] = await Promise.all([
          supabase.auth.getUser(),
          supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .maybeSingle<Profile>(),
        ]);
        if (!active) return;
        setEmail(u.user?.email ?? "");
        if (p?.nickname) setNickname(p.nickname);
      } catch {}
    };
    loadProfile();
    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId || tab !== "scraps") return;
    let active = true;
    const loadScraps = async () => {
      setLoadingScraps(true);
      try {
        const { data } = await supabase
          .from("scraps")
          .select("article_id,created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        if (!active) return;
        const ids = (data as ScrapRow[] | null)?.map((s) => s.article_id) ?? [];
        if (!ids.length) {
          setScraps([]);
          setLoadingScraps(false);
          return;
        }
        const list = await Promise.all(
          ids.map(async (id) => {
            try {
              const r = await fetch(`/api/articles/${encodeURIComponent(id)}`, {
                headers: { accept: "application/json" },
              });
              if (!r.ok) return null;
              const j = await r.json();
              return j.item as Article;
            } catch {
              return null;
            }
          })
        );
        if (!active) return;
        setScraps(list.filter(Boolean) as Article[]);
      } catch {
        setScraps([]);
      } finally {
        if (active) setLoadingScraps(false);
      }
    };
    loadScraps();
    return () => {
      active = false;
    };
  }, [tab, userId]);

  useEffect(() => {
    if (!userId || tab !== "replies") return;
    let active = true;
    const loadReplies = async () => {
      setLoadingReplies(true);
      try {
        const { data } = await supabase
          .from("replies")
          .select("id,article_id,user_id,body,created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        if (!active) return;
        setReplies((data as any) ?? []);
      } catch {
        setReplies([]);
      } finally {
        if (active) setLoadingReplies(false);
      }
    };
    loadReplies();
    return () => {
      active = false;
    };
  }, [tab, userId]);

  const disabled = useMemo(
    () => saving || nickname.trim().length < 2 || nickname.trim().length > 20,
    [saving, nickname]
  );

  const save = async () => {
    if (!userId) return;
    setError(null);
    setSaving(true);
    try {
      const { error: upErr } = await supabase
        .from("profiles")
        .upsert({ id: userId, nickname: nickname.trim(), email: email.trim() });
      if (upErr) {
        setError(upErr.message);
        return;
      }
      window.dispatchEvent(new Event("profile:created"));
    } catch (error: any) {
      setError(error?.message ?? "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const signOut = async () => {
    try {
      await resetFromDb();
      await supabase.auth.signOut();
      router.refresh();
    } catch {}
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-white border border-slate-100 shadow-card p-6">
        <div className="h-4 w-28 bg-slate-100 rounded animate-pulse mb-4" />
        <div className="h-10 w-full bg-slate-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="rounded-2xl bg-white border border-slate-100 shadow-card p-6">
        <div className="text-sm text-slate-600">
          Loading user information...
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white border border-slate-100 shadow-card overflow-hidden">
      <div className="px-4 pt-3 border-b border-slate-100">
        <nav className="flex gap-6">
          <button
            onClick={() => setTab("profile")}
            className={`px-1 py-3 text-sm font-medium ${
              tab === "profile"
                ? "text-slate-900 border-b-2 border-slate-900"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setTab("scraps")}
            className={`px-1 py-3 text-sm font-medium ${
              tab === "scraps"
                ? "text-slate-900 border-b-2 border-slate-900"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Scraps
          </button>
          <button
            onClick={() => setTab("replies")}
            className={`px-1 py-3 text-sm font-medium ${
              tab === "replies"
                ? "text-slate-900 border-b-2 border-slate-900"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            My replies
          </button>
        </nav>
      </div>

      {tab === "profile" && (
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-xs text-slate-600 mb-1">
                Nickname
              </span>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-200"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-slate-600 mb-1">Email</span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-200"
              />
            </label>
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div className="flex items-center gap-2">
            <button
              onClick={save}
              disabled={disabled}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--brand)] text-white text-sm hover:opacity-90 disabled:opacity-60"
            >
              Save
            </button>
            <button
              onClick={signOut}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {tab === "scraps" && (
        <div className="p-6">
          {loadingScraps && (
            <div className="text-sm text-slate-600">Loading...</div>
          )}
          {!loadingScraps && scraps.length === 0 && (
            <div className="text-sm text-slate-600">No scraps</div>
          )}
          {!loadingScraps && scraps.length > 0 && (
            <ul className="grid gap-3 list-none p-0 m-0">
              {scraps.map((a) => (
                <li
                  key={a.id}
                  className="rounded-2xl bg-white border border-slate-100 shadow-card p-4 hover:shadow transition"
                >
                  <Link
                    href={`/articles/${encodeURIComponent(a.id)}`}
                    className="flex gap-4"
                  >
                    {a.hero_img ? (
                      <img
                        src={a.hero_img}
                        alt=""
                        className="h-20 w-32 object-cover rounded-xl shrink-0"
                      />
                    ) : (
                      <div className="h-20 w-32 rounded-xl bg-slate-100 shrink-0 grid place-items-center text-slate-400 text-xs">
                        GOVNEWS
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[15px] font-semibold leading-snug line-clamp-2">
                        {a.title_en}
                      </h3>
                      {a.summary_en && (
                        <p className="mt-1 text-[12px] text-slate-600 leading-5 line-clamp-2">
                          {a.summary_en}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "replies" && (
        <div className="p-6 space-y-3">
          {loadingReplies && (
            <div className="text-sm text-slate-600">Loading...</div>
          )}
          {!loadingReplies && replies.length === 0 && (
            <div className="text-sm text-slate-600">No comments</div>
          )}
          {!loadingReplies &&
            replies.map((r) => <ReplyItem key={r.id} r={r} />)}
        </div>
      )}
    </div>
  );
}

function ReplyItem({
  r,
}: {
  r: { id: string; article_id: string; body: string; created_at: string };
}) {
  const t = useT();
  return (
    <div className="rounded-xl border border-slate-200 p-4 space-y-2">
      <Link
        href={`/articles/${encodeURIComponent(r.article_id)}`}
        className="text-xs text-slate-500 hover:underline"
      >
        {t("ui.goToArticle")}
      </Link>
      <div className="text-sm text-slate-800 whitespace-pre-line">{r.body}</div>
      <div className="text-xs text-slate-400">
        {new Date(r.created_at).toLocaleString()}
      </div>
    </div>
  );
}
