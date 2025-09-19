"use client";
import { useLocaleMode } from "@/lib/localePref";
import { Article } from "@/types/article";

export default function TitleBody({ a }: { a: Article }) {
  const { mode } = useLocaleMode();
  const title = mode === "ko" ? a.title_ko ?? a.title_en : mode === "en";
  const body = mode === "ko" ? a.summary_ko ?? a.summary_en : mode === "en";
  return (
    <>
      <h1 className="text-2xl font-bold">{title}</h1>
      {body && (
        <p className="mt-2 leading-7 text-slate-700 whitespace-pre-line">
          {body}
        </p>
      )}
    </>
  );
}
