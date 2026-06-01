'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="max-w-lg rounded-3xl border border-slate-200 bg-white/90 p-8 text-center shadow-[0_25px_80px_rgba(15,23,42,0.12)] backdrop-blur dark:border-white/10 dark:bg-slate-950/80">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          <Compass className="h-6 w-6" />
        </div>
        <p className="mt-5 text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
          Not found
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
          This page does not exist
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          The link may be outdated, or the route may have been removed from the triage workspace.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Go back
          </Button>
          <Button asChild>
            <Link href="/">Return home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
