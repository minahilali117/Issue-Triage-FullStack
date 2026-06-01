'use client';

import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import { Button } from '@/components/ui';
import {
  getChunkLoadErrorCopy,
  isChunkLoadError,
  normalizeClientError,
} from '@/lib/client-error';
import { createErrorReference, logClientError } from '@/lib/error-reference';

type RouteErrorFallbackProps = {
  error: unknown;
  reset: () => void;
  title?: string;
  description?: string;
  homeHref?: string;
};

export default function RouteErrorFallback({
  error,
  reset,
  title,
  description,
  homeHref = '/',
}: RouteErrorFallbackProps) {
  const referenceId = useMemo(() => createErrorReference(), [error]);
  const chunkLoadError = isChunkLoadError(error);
  const normalized = normalizeClientError(error);
  const chunkCopy = getChunkLoadErrorCopy();

  useEffect(() => {
    logClientError(error, referenceId);
  }, [error, referenceId]);

  const heading = chunkLoadError
    ? chunkCopy.title
    : (title ?? 'We could not load this view.');
  const body = chunkLoadError
    ? chunkCopy.description
    : (description ??
      'Something unexpected happened. You can try again or return to a safe page.');

  const reloadPage = () => {
    window.location.reload();
  };

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-6 py-10">
      <div className="max-w-lg rounded-3xl border border-slate-200 bg-white/90 p-8 text-center shadow-[0_25px_80px_rgba(15,23,42,0.12)] backdrop-blur dark:border-white/10 dark:bg-slate-950/80">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
          {chunkLoadError ? 'Update required' : 'Something went wrong'}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
          {heading}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{body}</p>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          Reference: <span className="font-mono text-slate-700 dark:text-slate-300">{referenceId}</span>
        </p>
        {process.env.NODE_ENV === 'development' && normalized.message ? (
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
            {normalized.name}: {normalized.message}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {chunkLoadError ? (
            <Button type="button" onClick={reloadPage}>
              Reload page
            </Button>
          ) : (
            <Button type="button" onClick={reset}>
              Try again
            </Button>
          )}
          <Button type="button" variant="outline" asChild>
            <Link href={homeHref}>Return home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
