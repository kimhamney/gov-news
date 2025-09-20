"use client";
import { Bookmark } from "lucide-react";
import { useScraps } from "@/contexts/ScrapContext";

type Size = "sm" | "md" | "lg";
const sizeMap: Record<Size, string> = {
  sm: "w-7 h-7",
  md: "w-8 h-8",
  lg: "w-10 h-10",
};
const iconMap: Record<Size, string> = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

export default function ScrapButton({
  articleId,
  className = "",
  size = "md",
}: {
  articleId: string;
  className?: string;
  size?: Size;
}) {
  const { has, toggle, ready } = useScraps();
  const scrapped = has(articleId);

  return (
    <button
      onClick={() => toggle(articleId)}
      disabled={!ready}
      aria-label={scrapped ? "Saved" : "Save"}
      className={`inline-flex items-center justify-center rounded-xl border border-transparent hover:border-[var(--line)] bg-transparent ${sizeMap[size]} disabled:opacity-60 ${className}`}
      style={{ color: scrapped ? "var(--accent)" : "var(--text-muted)" }}
    >
      <Bookmark
        className={iconMap[size]}
        strokeWidth={2}
        fill={scrapped ? "currentColor" : "none"}
      />
    </button>
  );
}
