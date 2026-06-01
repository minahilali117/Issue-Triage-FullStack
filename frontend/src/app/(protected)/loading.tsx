import { Skeleton } from '@/components/ui';

export default function ProtectedLoading() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white/75 px-5 py-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-white/5">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-3xl" />
        ))}
      </div>

      <Skeleton className="h-14 rounded-3xl" />
      <Skeleton className="h-[24rem] rounded-3xl" />
    </div>
  );
}
