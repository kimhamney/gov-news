import { CardSkeleton } from "@/components/Skeletons";

export default function Loading() {
  return (
    <main className="mx-auto max-w-5xl p-4 space-y-4">
      <ul className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </ul>
    </main>
  );
}
