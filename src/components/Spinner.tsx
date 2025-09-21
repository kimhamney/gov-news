"use client";
export default function Spinner({ size = 20 }: { size?: number }) {
  const s = `${size}px`;
  return (
    <span
      className="inline-block animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"
      style={{ width: s, height: s }}
      aria-label="loading"
    />
  );
}
