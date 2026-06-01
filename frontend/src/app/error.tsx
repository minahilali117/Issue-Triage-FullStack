'use client';

import RouteErrorFallback from '@/components/route-error-fallback';

export default function Error({
  error,
  reset,
}: Readonly<{
  error: unknown;
  reset: () => void;
}>) {
  return (
    <div className="min-h-screen">
      <RouteErrorFallback error={error} reset={reset} homeHref="/" />
    </div>
  );
}
