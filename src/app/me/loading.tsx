import { ProfileSkeleton } from "@/components/Skeletons";

export default function Loading() {
  return (
    <main className="mx-auto max-w-5xl p-4 space-y-4">
      <ProfileSkeleton />
    </main>
  );
}
