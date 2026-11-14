import type { ReactNode } from 'react';

import { cn } from '@/utils';

interface SectionHeaderProps {
  title: string;
  subtitle?: ReactNode;
  badges?: ReactNode;
  actions?: ReactNode;
  titleId?: string;
  headingAs?: 'h1' | 'h2' | 'h3';
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
}

export function SectionHeader({
  title,
  subtitle,
  badges,
  actions,
  titleId,
  headingAs = 'h2',
  className,
  titleClassName,
  subtitleClassName,
}: SectionHeaderProps) {
  const Heading = headingAs;

  return (
    <div className={cn('home-section-header', className)}>
      <div>
        {badges ? <div className="home-badge-row">{badges}</div> : null}
        <Heading
          id={titleId}
          className={cn('editorial-heading', titleClassName)}
        >
          {title}
        </Heading>
        {subtitle ? (
          <p className={cn('home-section-subtitle', subtitleClassName)}>
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ?? null}
    </div>
  );
}
