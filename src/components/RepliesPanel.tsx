"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useT } from "@/lib/i18n";

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
}: {
  articleId: string;
  initialList?: Reply[];
}) {
  const t = useT();
  const [userId, setUserId] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [list, setList] = useState<Reply[]>(initialList);
  const [loading, setLoading] = useState(initialList.length === 0);
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      setUserId(u?.id ?? null);
    });
    const load = async () => {
      if (initialList.length > 0) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data } = await supabase
        .from("replies")
        .select("id,user_id,article_id,body,created_at")
        .eq("article_id", articleId)
        .order("created_at", { ascending: false });
      setList((data as Reply[]) ?? []);
      setLoading(false);
    };
    load();
    const onChanged = () => load();
    window.addEventListener("replies:changed", onChanged);
    return () => window.removeEventListener("replies:changed", onChanged);
  }, [articleId, initialList]);

  const submit = async () => {
    if (!userId) {
      const origin = window.location.origin;
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${origin}/auth/callback` },
      });
      return;
    }
    const text = body.trim();
    if (!text) return;
    setSaving(true);
    await supabase
      .from("replies")
      .insert({ article_id: articleId, body: text, user_id: userId });
    setBody("");
    setSaving(false);
    window.dispatchEvent(new Event("replies:changed"));
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
    if (!editId || !userId) return;
    const text = editText.trim();
    if (!text) return;
    setUpdating(true);
    await supabase
      .from("replies")
      .update({ body: text })
      .eq("id", editId)
      .eq("user_id", userId);
    setUpdating(false);
    setEditId(null);
    setEditText("");
    window.dispatchEvent(new Event("replies:changed"));
  };

  const removeReply = async (id: string) => {
    if (!userId) return;
    if (!window.confirm(t("ui.confirmDelete"))) return;
    await supabase.from("replies").delete().eq("id", id).eq("user_id", userId);
    window.dispatchEvent(new Event("replies:changed"));
  };

  return (
    <div className="card p-6 space-y-4">
      <div className="space-y-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t("ui.writeComment")}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-200 min-h-[80px]"
        />
        <div className="flex justify-end">
          <button
            onClick={submit}
            disabled={saving}
            className="btn btn-brand disabled:opacity-60"
          >
            {saving ? t("ui.posting") : t("ui.post")}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {loading && (
          <div className="text-sm text-slate-600">{t("ui.loading")}</div>
        )}
        {!loading && list.length === 0 && (
          <div className="text-sm text-slate-600">{t("ui.noComments")}</div>
        )}
        {!loading &&
          list.map((r) => (
            <div key={r.id} className="rounded-xl border border-slate-200 p-4">
              {editId === r.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-200 min-h-[80px]"
                  />
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={cancelEdit} className="btn btn-ghost">
                      {t("ui.cancel")}
                    </button>
                    <button
                      onClick={applyEdit}
                      disabled={updating}
                      className="btn btn-brand disabled:opacity-60"
                    >
                      {updating ? t("ui.updating") : t("ui.update")}
                    </button>
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
                  <div className="text-xs text-slate-400 mt-2">
                    {new Date(r.created_at).toLocaleString()}
                  </div>
                </>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
