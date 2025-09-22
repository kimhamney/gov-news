"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useT } from "@/lib/i18n";
import { openAuthDialog } from "@/components/AuthModal";

type Reply = {
  id: string;
  user_id: string;
  article_id: string;
  body: string;
  created_at: string;
};

export default function RepliesPanel({
  articleId,
  initialList = [],
  onCountChange,
}: {
  articleId: string;
  initialList?: Reply[];
  onCountChange?: (n: number) => void;
}) {
  const t = useT();

  const [userId, setUserId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const [list, setList] = useState<Reply[]>(initialList);
  const [loading, setLoading] = useState(initialList.length === 0);

  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    let mounted = true;

    const resolveAuth = async () => {
      try {
        const seedUid =
          typeof document !== "undefined"
            ? document.body.dataset.uid || null
            : null;

        if (seedUid && mounted) {
          setUserId(seedUid);
          setAuthReady(true);
          return;
        }

        const { data } = await supabase.auth.getUser();
        if (!mounted) return;

        setUserId(data.user?.id ?? null);
        setAuthReady(true);
      } catch (error) {
        console.error("[RepliesPanel] Auth resolution error:", error);
        if (mounted) setAuthReady(true);
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!mounted) return;
      const nextId = s?.user?.id ?? null;
      console.log("[RepliesPanel] onAuthStateChange", { nextId });
      setUserId(nextId);
      setAuthReady(true);
    });

    resolveAuth();

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (initialList.length > 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data } = await supabase
          .from("replies")
          .select("id,user_id,article_id,body,created_at")
          .eq("article_id", articleId)
          .order("created_at", { ascending: false });

        if (!mounted) return;
        setList(((data as Reply[]) ?? []) as Reply[]);
      } catch (error) {
        console.error("[RepliesPanel] Error loading replies:", error);
        if (mounted) setList([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [articleId, initialList]);

  useEffect(() => {
    onCountChange?.(list.length);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("replies:count", {
          detail: { articleId, count: list.length },
        })
      );
    }
  }, [list.length, articleId, onCountChange]);

  const requireLogin = async (): Promise<boolean> => {
    if (!authReady) return false;

    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        console.log(
          "[RepliesPanel] User not authenticated, opening auth dialog"
        );
        openAuthDialog("login");
        return false;
      }
      return true;
    } catch (error) {
      console.error("[RepliesPanel] Auth check error:", error);
      openAuthDialog("login");
      return false;
    }
  };

  const submit = async () => {
    if (!(await requireLogin())) return;
    if (!userId) return;

    const text = body.trim();
    if (!text) return;

    setSaving(true);
    const temp: Reply = {
      id: `temp-${crypto.randomUUID()}`,
      user_id: userId,
      article_id: articleId,
      body: text,
      created_at: new Date().toISOString(),
    };

    setList((prev) => [temp, ...prev]);
    setBody("");

    try {
      const { data, error } = await supabase
        .from("replies")
        .insert({ article_id: articleId, body: text, user_id: userId })
        .select("id,user_id,article_id,body,created_at")
        .single();

      if (error || !data) throw error;

      setList((prev) =>
        prev.map((r) => (r.id === temp.id ? (data as Reply) : r))
      );
    } catch (error) {
      console.error("[RepliesPanel] Submit error:", error);
      setList((prev) => prev.filter((r) => r.id !== temp.id));
    } finally {
      setSaving(false);
    }
  };

  const beginEdit = (r: Reply) => {
    setEditId(r.id);
    setEditText(r.body);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditText("");
  };

  const applyEdit = async () => {
    if (!(await requireLogin())) return;
    if (!editId || !userId) return;

    const text = editText.trim();
    if (!text) return;

    setUpdating(true);
    const prev = list;

    setList((cur) =>
      cur.map((r) => (r.id === editId ? { ...r, body: text } : r))
    );

    try {
      const { error } = await supabase
        .from("replies")
        .update({ body: text })
        .eq("id", editId)
        .eq("user_id", userId);

      if (error) throw error;

      setEditId(null);
      setEditText("");
    } catch (error) {
      console.error("[RepliesPanel] Edit error:", error);
      setList(prev);
    } finally {
      setUpdating(false);
    }
  };

  const removeReply = async (id: string) => {
    if (!(await requireLogin())) return;
    if (!userId) return;
    if (!window.confirm(t("ui.confirmDelete"))) return;

    const prev = list;
    setList((cur) => cur.filter((r) => r.id !== id));

    try {
      const { error } = await supabase
        .from("replies")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) throw error;
    } catch (error) {
      console.error("[RepliesPanel] Delete error:", error);
      setList(prev);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      action();
    }
  };

  return (
    <div className="card p-6 space-y-4">
      <div className="space-y-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, submit)}
          onFocus={async (e) => {
            if (!authReady) return;
            const ok = await requireLogin();
            if (!ok) e.currentTarget.blur();
          }}
          placeholder={t("ui.writeComment")}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-200 min-h-[80px]"
        />
        <div className="flex justify-between items-center text-xs text-slate-500">
          <span>Ctrl+Enter to submit</span>
          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={saving || !body.trim()}
              className="px-3 py-1.5 rounded-xl bg-[var(--brand)] text-white text-sm hover:opacity-90 disabled:opacity-60"
            >
              {saving ? t("ui.posting") : t("ui.post")}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-slate-600">{t("ui.noComments")}</div>
      ) : list.length === 0 ? (
        <div className="text-sm text-slate-600">{t("ui.noComments")}</div>
      ) : (
        <div className="space-y-3">
          {list.map((r) => (
            <div key={r.id} className="rounded-xl border border-slate-200 p-4">
              {editId === r.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, applyEdit)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-200 min-h-[80px]"
                  />
                  <div className="flex items-center gap-2 justify-between">
                    <span className="text-xs text-slate-500">
                      Ctrl+Enter to save
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-sm hover:bg-slate-50"
                      >
                        {t("ui.cancel")}
                      </button>
                      <button
                        onClick={applyEdit}
                        disabled={updating || !editText.trim()}
                        className="px-3 py-1.5 rounded-xl bg-[var(--brand)] text-white text-sm hover:opacity-90 disabled:opacity-60"
                      >
                        {updating ? t("ui.updating") : t("ui.update")}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm text-slate-800 whitespace-pre-line">
                      {r.body}
                    </div>
                    {userId === r.user_id && (
                      <div className="shrink-0 flex items-center gap-2">
                        <button
                          onClick={() => beginEdit(r)}
                          className="text-xs text-slate-500 hover:text-slate-700"
                        >
                          {t("ui.edit")}
                        </button>
                        <button
                          onClick={() => removeReply(r.id)}
                          className="text-xs text-red-500 hover:text-red-600"
                        >
                          {t("ui.delete")}
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {new Date(r.created_at).toLocaleString()}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
