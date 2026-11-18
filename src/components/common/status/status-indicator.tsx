import '@/styles/components/status-indicator.css';
import { cn } from '@/utils';

interface StatusIndicatorProps {
  label: string;
  tone?: 'neutral' | 'success' | 'accent' | 'danger';
  className?: string;
}

/** Semantic status indicator pairing a colored dot with explicit text. */
export function StatusIndicator({
  label,
  tone = 'neutral',
  className,
}: StatusIndicatorProps) {
  return (
    <span
      className={cn(
        'ui-status-indicator',
        `ui-status-indicator--${tone}`,
        className,
      )}
    >
      <span className="ui-status-dot" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
