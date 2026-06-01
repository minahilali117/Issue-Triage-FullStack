import { Skeleton } from '@/components/ui';

export default function Loading() {
  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-400 gap-6 lg:grid-cols-[auto_minmax(0,1fr)]">
        <aside className="hidden h-[calc(100vh-3rem)] w-72 rounded-3xl border border-slate-200 bg-white/70 p-4 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur lg:block dark:border-white/10 dark:bg-white/5">
          <div className="grid gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="mt-4 h-24 w-full rounded-3xl" />
          </div>
        </aside>

        <main className="grid gap-6">
          <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white/75 px-5 py-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-white/5 sm:px-6">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-3xl" />
            ))}
          </div>

          <Skeleton className="h-[28rem] rounded-3xl" />
        </main>
      </div>
    </div>
  );
}