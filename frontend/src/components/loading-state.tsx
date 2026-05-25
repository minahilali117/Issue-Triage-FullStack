import { Skeleton } from './ui';

type LoadingStateProps = {
  label: string;
  variant?: 'panel' | 'list' | 'details';
};

export default function LoadingState({ label, variant = 'panel' }: LoadingStateProps) {
  if (variant === 'list') {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-white/10">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="mt-4 grid gap-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="grid gap-2 rounded-2xl border border-slate-200 p-4 dark:border-white/10">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="grid flex-1 gap-2">
                  <Skeleton className="h-4 w-3/5" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
                <Skeleton className="h-7 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    );
  }

  if (variant === 'details') {
    return (
      <div className="grid gap-4">
        <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-7 w-3/5" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
            <Skeleton className="h-4 w-24" />
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
          <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 text-sm text-slate-500 shadow-[0_20px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
      <div className="grid gap-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <p className="mt-4">{label}</p>
    </div>
  );
}
