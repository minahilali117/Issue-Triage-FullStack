'use client';

import RouteErrorFallback from '@/components/route-error-fallback';

export default function SettingsError({
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
      title="Settings unavailable"
      description="We could not load your account settings. Try again or return to the dashboard."
      homeHref="/"
    />
  );
}
