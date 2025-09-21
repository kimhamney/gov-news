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
  ids: Set<string>;
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
  const userRef = useRef<string | null>(null);
  const loadingRef = useRef(false);

  const fetchUser = async () => {
    const { data } = await supabase.auth.getUser();
    userRef.current = data.user?.id ?? null;
    return userRef.current;
  };

  const loadFromDb = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    const uid = userRef.current ?? (await fetchUser());
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
      const next = new Set<string>((data ?? []).map((r: any) => r.article_id));
      setIds(next);
      setReady(true);
    } else {
      setReady(true);
    }
    loadingRef.current = false;
  }, []);

  useEffect(() => {
    loadFromDb();
  }, [loadFromDb]);

  useEffect(() => {
    const sub = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_OUT") {
        setIds(new Set());
        setReady(true);
      } else {
        await fetchUser();
        await loadFromDb();
      }
    });
    return () => sub.data.subscription.unsubscribe();
  }, [loadFromDb]);

  const isScrapped = useCallback((id: string) => ids.has(id), [ids]);

  const add = useCallback(async (id: string) => {
    const uid = userRef.current ?? (await fetchUser());
    if (!uid) return;
    setIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    const { error } = await supabase
      .from("scraps")
      .insert({ user_id: uid, article_id: id });
    if (error) {
      setIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } else {
      window.dispatchEvent(
        new CustomEvent("scrap:changed", { detail: { id, active: true } })
      );
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    const uid = userRef.current ?? (await fetchUser());
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
      setIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
    } else {
      window.dispatchEvent(
        new CustomEvent("scrap:changed", { detail: { id, active: false } })
      );
    }
  }, []);

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
    () => ({ ids, ready, isScrapped, toggle, add, remove, resetFromDb }),
    [ids, ready, isScrapped, toggle, add, remove, resetFromDb]
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
