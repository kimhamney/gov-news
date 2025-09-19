"use client";
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
      className={`grid place-items-center rounded-full ${sizeMap[size]} disabled:opacity-60 ${className}`}
      style={{
        border: `1px solid var(--accent)`,
        color: scrapped ? "#fff" : "var(--accent)",
        background: scrapped ? "var(--accent)" : "#fff",
      }}
    >
      <svg
        viewBox="0 0 24 24"
        className={`${iconMap[size]} pointer-events-none`}
      >
        <path
          d="M6 3h12a1 1 0 0 1 1 1v16l-7-4-7 4V4a1 1 0 0 1 1-1z"
          fill="currentColor"
          style={{ opacity: scrapped ? 1 : 0 }}
        />
        <path
          d="M6 3h12a1 1 0 0 1 1 1v16l-7-4-7 4V4a1 1 0 0 1 1-1z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
