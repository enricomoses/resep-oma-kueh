'use client';

import { ErrorFallbackPanel } from '@/components/site/error-fallback-panel';

interface RootErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: RootErrorProps) {
  return (
    <main id="main-content">
      <ErrorFallbackPanel error={error} reset={reset} />
    </main>
  );
}
