"use client";
import Link from "next/link";
import AuthButton from "@/components/AuthButton";

export default function TopBar() {
  return (
    <header
      className="sticky top-0 z-40 bg-white/85 backdrop-blur border-b"
      style={{ borderColor: "var(--line)" }}
    >
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
        <Link
          href="/"
          className="font-black tracking-tight text-brand text-2xl italic"
        >
          GOVNEWS
        </Link>
        <div className="flex items-center gap-2">
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
