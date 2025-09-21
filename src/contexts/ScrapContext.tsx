"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "@/lib/supabaseClient";

type ScrapContextValue = {
  ready: boolean;
  isScrapped: (id: string) => boolean;
  toggle: (id: string) => Promise<void>;
  add: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  resetFromDb: () => Promise<void>;
};

const ScrapContext = createContext<ScrapContextValue | null>(null);

export function ScrapProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);
  const userIdRef = useRef<string | null>(null);
  const loadingRef = useRef(false);

  const fetchUserId = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    userIdRef.current = data.user?.id ?? null;
    return userIdRef.current;
  }, []);

  const loadFromDb = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    const uid = userIdRef.current ?? (await fetchUserId());
    if (!uid) {
      setIds(new Set());
      setReady(true);
      loadingRef.current = false;
      return;
    }

    const { data, error } = await supabase
      .from("scraps")
      .select("article_id")
      .eq("user_id", uid);

    if (!error) {
      setIds(new Set((data ?? []).map((r: any) => r.article_id)));
    }
    setReady(true);
    loadingRef.current = false;
  }, [fetchUserId]);

  useEffect(() => {
    loadFromDb();
  }, [loadFromDb]);

  useEffect(() => {
    const sub = supabase.auth.onAuthStateChange(async (e) => {
      if (e === "SIGNED_OUT") {
        userIdRef.current = null;
        setIds(new Set());
        setReady(true);
      } else {
        await fetchUserId();
        await loadFromDb();
      }
    });
    return () => sub.data.subscription.unsubscribe();
  }, [fetchUserId, loadFromDb]);

  const isScrapped = useCallback((id: string) => ids.has(id), [ids]);

  const add = useCallback(
    async (id: string) => {
      const uid = userIdRef.current ?? (await fetchUserId());
      if (!uid) return;

      setIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));

      const { error } = await supabase
        .from("scraps")
        .insert({ user_id: uid, article_id: id });

      if (error) {
        setIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [fetchUserId]
  );

  const remove = useCallback(
    async (id: string) => {
      const uid = userIdRef.current ?? (await fetchUserId());
      if (!uid) return;

      setIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      const { error } = await supabase
        .from("scraps")
        .delete()
        .eq("user_id", uid)
        .eq("article_id", id);

      if (error) {
        setIds((prev) => new Set(prev).add(id));
      }
    },
    [fetchUserId]
  );

  const toggle = useCallback(
    async (id: string) => {
      if (ids.has(id)) await remove(id);
      else await add(id);
    },
    [ids, add, remove]
  );

  const resetFromDb = useCallback(async () => {
    await loadFromDb();
  }, [loadFromDb]);

  const value = useMemo(
    () => ({ ready, isScrapped, toggle, add, remove, resetFromDb }),
    [ready, isScrapped, toggle, add, remove, resetFromDb]
  );

  return (
    <ScrapContext.Provider value={value}>{children}</ScrapContext.Provider>
  );
}

export function useScrap() {
  const v = useContext(ScrapContext);
  if (!v) throw new Error("useScrap must be used within ScrapProvider");
  return v;
}
