'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui';

export default function Error({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="max-w-lg rounded-3xl border border-slate-200 bg-white/90 p-8 text-center shadow-[0_25px_80px_rgba(15,23,42,0.12)] backdrop-blur dark:border-white/10 dark:bg-slate-950/80">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Something went wrong</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">We could not load this view.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Try again, and if the issue continues, reload the page.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <Button type="button" variant="outline" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </div>
      </div>
    </div>
  );
}