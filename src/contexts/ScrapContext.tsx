"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";

type ScrapContextValue = {
  ready: boolean;
  isScrapped: (id: string) => boolean;
  toggle: (id: string) => Promise<void>;
  add: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  resetFromDb: () => Promise<void>;
};

export const ScrapContext = createContext<ScrapContextValue | null>(null);

export function ScrapProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  const loadFromDb = useCallback(async () => {
    if (!userId) {
      setIds(new Set());
      setReady(true);
      return;
    }
    const { data, error } = await supabase
      .from("scraps")
      .select("article_id")
      .eq("user_id", userId);
    if (!error) setIds(new Set((data ?? []).map((r: any) => r.article_id)));
    setReady(true);
  }, [userId]);

  useEffect(() => {
    setReady(false);
    loadFromDb();
  }, [loadFromDb]);

  const isScrapped = useCallback((id: string) => ids.has(id), [ids]);

  const add = useCallback(
    async (id: string) => {
      if (!userId) return;
      setIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
      const { error } = await supabase
        .from("scraps")
        .insert({ user_id: userId, article_id: id });
      if (error)
        setIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
    },
    [userId]
  );

  const remove = useCallback(
    async (id: string) => {
      if (!userId) return;
      setIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      const { error } = await supabase
        .from("scraps")
        .delete()
        .eq("user_id", userId)
        .eq("article_id", id);
      if (error) setIds((prev) => new Set(prev).add(id));
    },
    [userId]
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

export function useScrapSafe() {
  return useContext(ScrapContext);
}
