import type { ReactNode } from 'react';

import { cn } from '@/utils';
import '@/styles/components/page-sections.css';

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
    <div
      className={cn(
        'content-header-block',
        aside && 'content-header-block--split',
        className,
      )}
    >
      {badges ? <div className="home-badge-row">{badges}</div> : null}
      <div className={cn(aside && 'content-header-row--split', rowClassName)}>
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
