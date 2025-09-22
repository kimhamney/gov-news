"use client";
export const dynamic = "force-dynamic";

import ProfileTabs from "@/components/ProfileTabs";
import { openAuthDialog } from "@/components/AuthModal";
import { useAuth } from "@/contexts/AuthContext";

export default function MePage() {
  const { userId, loading, isAuthenticated } = useAuth();

  console.log("[/me] Render", { userId, loading, isAuthenticated });

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl p-4">
        <div className="rounded-xl border border-slate-200 p-6 text-center">
          <div className="text-sm text-slate-600 mb-2">
            Loading your profile...
          </div>
          <div className="w-6 h-6 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="mx-auto max-w-5xl p-4">
        <div className="rounded-xl border border-slate-200 p-6 text-center space-y-4">
          <div className="text-sm text-slate-700">
            Please sign in to access your profile.
          </div>
          <button
            onClick={() => openAuthDialog("login")}
            className="px-4 py-2 rounded-xl bg-[var(--brand)] text-white text-sm hover:opacity-90 transition"
          >
            Sign In
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl p-4">
      <ProfileTabs />
    </main>
  );
}
