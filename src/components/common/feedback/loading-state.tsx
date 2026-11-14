import { cn } from '@/utils';

interface LoadingStateProps {
  message: string;
  className?: string;
}

export function LoadingState({ message, className }: LoadingStateProps) {
  return (
    <div
      className={cn('cart-loading-state', className)}
      role="status"
      aria-live="polite"
    >
      <div className="cart-spinner" aria-hidden="true" />
      <p className="cart-loading-text">{message}</p>
    </div>
  );
}
