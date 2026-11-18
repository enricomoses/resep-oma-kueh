import type { CSSProperties } from 'react';

import '@/styles/components/skeleton.css';
import { cn } from '@/utils';

interface SkeletonProps {
  width?: string;
  height?: string;
  radius?: 'sm' | 'md' | 'card' | 'pill' | 'circle';
  className?: string;
}

/** Warm bakery-themed loading placeholder bone with reduced-motion support. */
export function Skeleton({
  width,
  height = '1rem',
  radius = 'sm',
  className,
}: SkeletonProps) {
  const style: CSSProperties = {
    ...(width ? { width } : {}),
    height,
  };

  return (
    <span
      aria-hidden="true"
      style={style}
      className={cn(
        'ui-skeleton',
        radius !== 'sm' && `ui-skeleton--${radius}`,
        className,
      )}
    />
  );
}
