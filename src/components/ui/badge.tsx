import type { ComponentPropsWithRef } from 'react';

import { cn } from '@/utils';

interface BadgeProps extends ComponentPropsWithRef<'span'> {
  tone?: 'neutral' | 'accent' | 'success' | 'danger';
}
export function Badge({ className, tone = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      {...props}
      className={cn(
        'ui-badge',
        tone !== 'neutral' && `ui-badge--${tone}`,
        className,
      )}
    />
  );
}
