import { RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Feedback } from '@/components/ui/feedback';
import { cn } from '@/utils';

interface ErrorStateProps {
  title: string;
  message: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  isRetrying?: boolean;
  announce?: boolean;
  actions?: ReactNode;
  className?: string;
}

export function ErrorState({
  title,
  message,
  onRetry,
  retryLabel = 'Coba Lagi',
  isRetrying = false,
  announce = true,
  actions,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('content-error-block', className)}>
      <Feedback tone="error" title={title} announce={announce}>
        {typeof message === 'string' ? <p>{message}</p> : message}
      </Feedback>
      {onRetry || actions ? (
        <div className="flex flex-wrap items-center gap-3">
          {onRetry ? (
            <Button
              type="button"
              variant="secondary"
              loading={isRetrying}
              onClick={onRetry}
              className="inline-flex items-center gap-2"
            >
              <RotateCcw size={16} aria-hidden="true" />
              {retryLabel}
            </Button>
          ) : null}
          {actions ?? null}
        </div>
      ) : null}
    </div>
  );
}
