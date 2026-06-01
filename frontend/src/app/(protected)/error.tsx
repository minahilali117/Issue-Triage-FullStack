'use client';

import RouteErrorFallback from '@/components/route-error-fallback';

export default function ProtectedError({
  error,
  reset,
}: Readonly<{
  error: unknown;
  reset: () => void;
}>) {
  return (
    <RouteErrorFallback
      error={error}
      reset={reset}
      title="Dashboard unavailable"
      description="We could not load the workspace. Your data is safe — try again or return to the dashboard home."
      homeHref="/"
    />
  );
}
