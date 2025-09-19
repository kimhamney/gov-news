"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Mode = "ko" | "en";

type Ctx = { mode: Mode; setMode: (m: Mode) => void };
const LocaleCtx = createContext<Ctx | null>(null);

export function LocaleProvider({
  initialMode,
  children,
}: {
  initialMode: Mode;
  children: React.ReactNode;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  useEffect(() => {
    document.cookie = `localeMode=${mode}; path=/; max-age=31536000`;
    window.dispatchEvent(new Event("locale:mode"));
  }, [mode]);
  const value = useMemo(() => ({ mode, setMode }), [mode]);
  return <LocaleCtx.Provider value={value}>{children}</LocaleCtx.Provider>;
}

export function useLocaleMode() {
  const ctx = useContext(LocaleCtx);
  if (ctx) return ctx;
  return { mode: "en" as Mode, setMode: () => {} };
}
