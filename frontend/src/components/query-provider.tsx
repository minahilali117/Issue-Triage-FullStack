'use client';

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { useState } from 'react';
import { showApiErrorToast } from '@/lib/api-errors';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error, query) => {
            if (query.meta?.toastOnError) {
              showApiErrorToast(error, {
                fallback: String(query.meta.errorFallback ?? 'Could not load data.'),
                dedupeKey: `query:${String(query.queryKey[0] ?? 'unknown')}`,
              });
            }
          },
        }),
        mutationCache: new MutationCache({
          onError: (error, _variables, _context, mutation) => {
            if (mutation.meta?.suppressApiToast) {
              return;
            }

            if (mutation.meta?.toastOnError === false) {
              return;
            }

            showApiErrorToast(error, {
              fallback: String(mutation.meta?.errorFallback ?? 'Action failed. Please try again.'),
              dedupeKey: mutation.options.mutationKey
                ? `mutation:${String(mutation.options.mutationKey[0])}`
                : undefined,
            });
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 20_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
