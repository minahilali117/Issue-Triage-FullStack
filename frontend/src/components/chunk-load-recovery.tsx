'use client';

import { useEffect } from 'react';
import { isChunkLoadError } from '@/lib/client-error';

const CHUNK_RELOAD_KEY = 'triage_chunk_reload';

/**
 * After a dev rebuild or deploy, stale chunk URLs can fail to load.
 * Reload once automatically so users are not stuck on the error boundary.
 */
export default function ChunkLoadRecovery() {
  useEffect(() => {
    try {
      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    } catch {
      // Ignore storage failures.
    }

    const tryRecover = (reason: unknown) => {
      if (!isChunkLoadError(reason)) {
        return;
      }

      try {
        const alreadyReloaded = sessionStorage.getItem(CHUNK_RELOAD_KEY);
        if (alreadyReloaded) {
          sessionStorage.removeItem(CHUNK_RELOAD_KEY);
          return;
        }

        sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
        window.location.reload();
      } catch {
        window.location.reload();
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      tryRecover(event.reason);
    };

    const handleWindowError = (event: ErrorEvent) => {
      tryRecover(event.error ?? event.message);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleWindowError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleWindowError);
    };
  }, []);

  return null;
}
