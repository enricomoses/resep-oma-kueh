import type { ComponentPropsWithRef } from 'react';

import { cn } from '@/utils';

interface CardProps extends ComponentPropsWithRef<'article'> {
  tone?: 'surface' | 'cream';
}
export function Card({ className, tone = 'surface', ...props }: CardProps) {
  return (
    <article
      {...props}
      className={cn('ui-card', tone === 'cream' && 'ui-card--cream', className)}
    />
  );
}
