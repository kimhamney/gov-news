export function CardSkeleton() {
  return (
    <li className="relative rounded-2xl bg-white border border-slate-100 shadow-card p-4 animate-pulse">
      <div className="absolute right-3 top-3 w-7 h-7 md:w-8 md:h-8 rounded-full border border-slate-200" />
      <div className="flex gap-4">
        <div className="h-20 w-32 rounded-xl bg-slate-100 shrink-0" />
        <div className="min-w-0 flex-1 pr-12 space-y-2">
          <div className="h-4 bg-slate-100 rounded w-3/4" />
          <div className="h-4 bg-slate-100 rounded w-2/3" />
          <div className="h-3 bg-slate-100 rounded w-1/3 mt-3" />
        </div>
      </div>
    </li>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="relative rounded-2xl bg-white border border-slate-100 shadow-card overflow-hidden">
        <div className="absolute right-4 top-4 w-8 h-8 rounded-full border border-slate-200 animate-pulse" />
        <div className="w-full h-48 md:h-64 bg-slate-100 animate-pulse" />
        <div className="p-6 space-y-3">
          <div className="h-3 bg-slate-100 rounded w-24" />
          <div className="h-6 bg-slate-100 rounded w-3/4" />
          <div className="h-4 bg-slate-100 rounded w-full" />
          <div className="h-4 bg-slate-100 rounded w-5/6" />
        </div>
      </div>
      <div className="rounded-2xl bg-white border border-slate-100 shadow-card p-6 space-y-3">
        <div className="h-4 bg-slate-100 rounded w-40" />
        <div className="h-20 bg-slate-100 rounded" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-card">
      <div className="flex border-b border-slate-100">
        <div className="px-4 py-3 text-sm">Profile</div>
        <div className="px-4 py-3 text-sm text-slate-400">Scraps</div>
        <div className="px-4 py-3 text-sm text-slate-400">My replies</div>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
        <div className="space-y-2">
          <div className="h-3 w-20 bg-slate-100 rounded" />
          <div className="h-10 w-full bg-slate-100 rounded-xl" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-16 bg-slate-100 rounded" />
          <div className="h-10 w-full bg-slate-100 rounded-xl" />
        </div>
        <div className="col-span-full h-9 w-24 bg-slate-100 rounded-xl" />
      </div>
    </div>
  );
}
