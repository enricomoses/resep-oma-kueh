import type { ReactNode } from 'react';

import { cn } from '@/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  badges?: ReactNode;
  aside?: ReactNode;
  alert?: ReactNode;
  children?: ReactNode;
  titleId?: string;
  headingAs?: 'h1' | 'h2';
  className?: string;
  rowClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
}

export function PageHeader({
  title,
  subtitle,
  badges,
  aside,
  alert,
  children,
  titleId,
  headingAs = 'h1',
  className,
  rowClassName,
  titleClassName,
  subtitleClassName,
}: PageHeaderProps) {
  const Heading = headingAs;

  return (
    <div className={cn('content-header-block', className)}>
      {badges ? <div className="home-badge-row">{badges}</div> : null}
      <div
        className={cn(
          aside && 'flex flex-wrap items-baseline justify-between gap-4',
          rowClassName,
        )}
      >
        <div>
          <Heading
            id={titleId}
            className={cn('editorial-display', titleClassName)}
          >
            {title}
          </Heading>
          {subtitle ? (
            <p className={cn('editorial-lead', subtitleClassName)}>
              {subtitle}
            </p>
          ) : null}
        </div>
        {aside ?? null}
      </div>
      {alert ?? null}
      {children ?? null}
    </div>
  );
}
