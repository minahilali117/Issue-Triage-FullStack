import Link from 'next/link';
import { Button } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="max-w-lg rounded-3xl border border-slate-200 bg-white/90 p-8 text-center shadow-[0_25px_80px_rgba(15,23,42,0.12)] backdrop-blur dark:border-white/10 dark:bg-slate-950/80">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Not found</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">This page does not exist.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          The link may be outdated, or the route may have been removed.
        </p>
        <div className="mt-6 flex justify-center">
          <Button asChild>
            <Link href="/">Go back home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}