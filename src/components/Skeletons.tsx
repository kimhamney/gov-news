"use client";

export function CardSkeleton() {
  return (
    <li
      className="col-span-full relative overflow-hidden rounded-2xl border bg-white/90 backdrop-blur p-3 md:p-4 animate-pulse"
      style={{ borderColor: "var(--line)" }}
    >
      <div
        className="absolute right-3 top-3 h-8 w-8 rounded-full border bg-white/70"
        style={{ borderColor: "var(--line)" }}
      />
      <div className="flex gap-3 md:gap-4">
        <div className="h-20 w-28 md:w-32 shrink-0 rounded-xl bg-slate-100" />
        <div className="min-w-0 flex-1 pr-16 md:pr-20">
          <div className="h-4 rounded bg-slate-100 w-4/5" />
          <div className="mt-2 flex items-center gap-2">
            <div className="h-5 w-20 rounded-full bg-slate-100" />
            <div className="h-3 w-16 rounded bg-slate-100" />
          </div>
        </div>
      </div>
    </li>
  );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <ul className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </ul>
  );
}

export function FeaturedSkeleton() {
  return (
    <section className="space-y-3 animate-pulse">
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl bg-slate-100" />
      <div className="px-1 space-y-3">
        <div className="h-7 sm:h-8 rounded bg-slate-100 w-3/4" />
        <div className="flex items-center gap-3">
          <div className="h-3 rounded bg-slate-100 w-24" />
          <span className="h-3 w-3 rounded-full bg-slate-100" />
          <div className="h-3 rounded bg-slate-100 w-28" />
        </div>
      </div>
    </section>
  );
}

export function DetailSkeleton() {
  return (
    <article className="overflow-hidden rounded-3xl shadow-sm">
      <div className="relative">
        <div className="w-full aspect-[16/9] sm:aspect-[21/9] md:aspect-[2/1] bg-slate-100 animate-pulse" />
        <div
          className="absolute right-3 top-3 h-8 w-8 rounded-full border bg-white/80 backdrop-blur"
          style={{ borderColor: "var(--line)" }}
        />
      </div>
      <div className="p-4 sm:p-6 md:p-8 space-y-6">
        <div className="h-7 sm:h-8 md:h-9 rounded bg-slate-100 w-5/6" />
        <div
          className="rounded-2xl border bg-white/70 backdrop-blur px-4 py-4 space-y-2"
          style={{ borderColor: "var(--line)" }}
        >
          <div className="h-3 rounded bg-slate-100 w-11/12" />
          <div className="h-3 rounded bg-slate-100 w-10/12" />
        </div>
        <div className="space-y-2">
          <div className="h-4 rounded bg-slate-100 w-full" />
          <div className="h-4 rounded bg-slate-100 w-11/12" />
          <div className="h-4 rounded bg-slate-100 w-10/12" />
          <div className="h-4 rounded bg-slate-100 w-9/12" />
        </div>
        <div className="pt-1 flex items-center gap-2">
          <div
            className="h-7 w-20 rounded-lg border"
            style={{ borderColor: "var(--line)" }}
          />
          <div
            className="h-6 w-14 rounded-full bg-white/80 backdrop-blur border"
            style={{ borderColor: "var(--line)" }}
          />
        </div>
      </div>
    </article>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="rounded-3xl bg-white border border-slate-100 shadow-card overflow-hidden">
      <div className="px-4 pt-3 border-b border-slate-100">
        <div className="flex gap-2">
          <div className="h-8 w-20 rounded-full bg-slate-100" />
          <div className="h-8 w-20 rounded-full bg-slate-100/80" />
          <div className="h-8 w-24 rounded-full bg-slate-100/60" />
        </div>
      </div>
      <div className="p-6 flex flex-col gap-4 animate-pulse">
        <div className="space-y-2">
          <div className="h-3 w-28 bg-slate-100 rounded" />
          <div className="h-10 w-full bg-slate-100 rounded-xl" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-24 bg-slate-100 rounded" />
          <div className="h-10 w-full bg-slate-100 rounded-xl" />
        </div>
        <div className="flex gap-3">
          <div className="h-9 w-28 bg-slate-100 rounded-xl" />
          <div className="h-9 w-28 bg-slate-100 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
