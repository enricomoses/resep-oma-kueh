'use client';

import { ErrorFallbackPanel } from '@/components/common/feedback/error-fallback-panel';

interface SiteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function SiteError({ error, reset }: SiteErrorProps) {
  return <ErrorFallbackPanel error={error} reset={reset} />;
}
