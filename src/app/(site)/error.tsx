'use client';

import { ErrorFallbackPanel } from '@/components/site/error-fallback-panel';

interface SiteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function SiteError({ error, reset }: SiteErrorProps) {
  return <ErrorFallbackPanel error={error} reset={reset} />;
}
