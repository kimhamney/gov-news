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

type Ctx = {
  ready: boolean;
  userId: string | null;
  has: (id: string) => boolean;
  toggle: (id: string) => Promise<void>;
};

const ScrapCtx = createContext<Ctx>({
  ready: false,
  userId: null,
  has: () => false,
  toggle: async () => {},
});

export function ScrapProvider({
  initialUserId = null,
  initialScraps = [],
  children,
}: {
  initialUserId?: string | null;
  initialScraps?: string[];
  children: React.ReactNode;
}) {
  const [userId, setUserId] = useState<string | null>(initialUserId);
  const [ids, setIds] = useState<Set<string>>(() => new Set(initialScraps));
  const [ready, setReady] = useState(true);

  useEffect(() => {
    const sub = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null;
      setUserId(u?.id ?? null);
      if (!u) setIds(new Set());
    });
    return () => sub.data.subscription.unsubscribe();
  }, []);

  const has = useCallback((id: string) => ids.has(id), [ids]);

  const toggle = useCallback(
    async (articleId: string) => {
      if (!userId) {
        const origin = window.location.origin;
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: `${origin}/auth/callback` },
        });
        return;
      }
      setReady(false);
      if (ids.has(articleId)) {
        await supabase
          .from("scraps")
          .delete()
          .eq("user_id", userId)
          .eq("article_id", articleId);
        setIds((prev) => {
          const next = new Set(prev);
          next.delete(articleId);
          return next;
        });
      } else {
        await supabase
          .from("scraps")
          .insert({ user_id: userId, article_id: articleId });
        setIds((prev) => new Set(prev).add(articleId));
      }
      setReady(true);
    },
    [ids, userId]
  );

  const value = useMemo(
    () => ({ ready, userId, has, toggle }),
    [ready, userId, has, toggle]
  );

  return <ScrapCtx.Provider value={value}>{children}</ScrapCtx.Provider>;
}

export function useScraps() {
  return useContext(ScrapCtx);
}
