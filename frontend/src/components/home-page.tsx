'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import Dashboard from '@/components/dashboard';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isReady } = useAuth();

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isReady, router]);

  if (!isReady) {
    return <div className="min-h-screen p-8">Loading session...</div>;
  }

  if (!isAuthenticated) {
    return <div className="min-h-screen p-8">Redirecting to login...</div>;
  }

  return (
    <>
      <section className="grid gap-3 rounded-3xl border border-slate-200 bg-white/75 px-5 py-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-white/5 sm:px-6">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Today at a glance</p>
        <h2 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
          Triage, assign, and close issues with clarity.
        </h2>
        <p className="max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
          Track engineering requests with fast filters, consistent priorities,
          and a calm, responsive workflow that feels alive without getting loud.
        </p>
      </section>

      <div className="mt-8">
        <Dashboard />
      </div>
    </>
  );
}