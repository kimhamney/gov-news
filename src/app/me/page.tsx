"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import ProfileTabs from "@/components/ProfileTabs";
import { ProfileSkeleton } from "@/components/Skeletons";

export default function MePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <main className="mx-auto max-w-5xl p-4">
      {mounted ? <ProfileTabs /> : <ProfileSkeleton />}
    </main>
  );
}
