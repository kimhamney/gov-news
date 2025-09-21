"use client";
import Link from "next/link";
import AuthButton from "@/components/AuthButton";
import AuthModal from "@/components/AuthModal";

export default function TopBar() {
  return (
    <header
      className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b"
      style={{ borderColor: "var(--line)" }}
    >
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
        <Link
          href="/"
          className="font-black tracking-tight text-brand text-xl italic"
        >
          GOVNEWS
        </Link>
        <div className="min-w-[120px] flex justify-end">
          <AuthButton />
        </div>
      </div>
      <AuthModal />
    </header>
  );
}
