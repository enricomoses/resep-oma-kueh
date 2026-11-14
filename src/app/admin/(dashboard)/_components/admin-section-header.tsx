import type { ReactNode } from 'react';

import { cn } from '@/utils';

interface AdminSectionHeaderProps {
  title: ReactNode;
  eyebrow?: string;
  description?: ReactNode;
  leading?: ReactNode;
  actions?: ReactNode;
  headingAs?: 'h1' | 'h2' | 'h3';
  titleId?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  className?: string;
}

/**
 * Shared header block for admin dashboard pages and management section cards.
 */
export function AdminSectionHeader({
  title,
  eyebrow,
  description,
  leading,
  actions,
  headingAs = 'h2',
  titleId,
  titleClassName,
  descriptionClassName,
  className,
}: AdminSectionHeaderProps) {
  const Heading = headingAs;

  return (
    <div className={cn('admin-section-header', className)}>
      <div>
        {leading ?? null}
        {eyebrow ? <p className="admin-eyebrow">{eyebrow}</p> : null}
        <Heading
          id={titleId}
          className={cn('admin-section-title', titleClassName)}
        >
          {title}
        </Heading>
        {description ? (
          <p className={cn('admin-section-subtitle', descriptionClassName)}>
            {description}
          </p>
        ) : null}
      </div>
      {actions ?? null}
    </div>
  );
}
