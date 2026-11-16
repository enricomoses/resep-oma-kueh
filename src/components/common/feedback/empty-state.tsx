import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';

import { Card } from '@/components/ui/card';
import { cn } from '@/utils';
import '@/styles/components/feedback-states.css';

type EmptyStateHeadingTag = 'h1' | 'h2' | 'h3' | 'p';
type EmptyStateSize = 'sm' | 'md' | 'lg';

interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  tone?: 'surface' | 'cream';
  size?: EmptyStateSize;
  headingAs?: EmptyStateHeadingTag;
  announce?: boolean;
  className?: string;
}

const DEFAULT_ICON_SIZE: Record<EmptyStateSize, number> = {
  sm: 20,
  md: 24,
  lg: 34,
};

/**
 * Centered editorial empty-state card with an icon medallion, title,
 * optional supporting description, and optional action controls.
 */
export function EmptyState({
  title,
  description,
  icon,
  action,
  children,
  tone = 'surface',
  size = 'md',
  headingAs = 'h2',
  announce = false,
  className,
}: EmptyStateProps) {
  const Heading = headingAs;
  const resolvedIcon =
    icon === undefined ? (
      <Inbox
        size={DEFAULT_ICON_SIZE[size]}
        strokeWidth={1.65}
        aria-hidden="true"
      />
    ) : (
      icon
    );

  return (
    <Card
      tone={tone}
      role={announce ? 'status' : undefined}
      className={cn(
        'empty-state',
        size !== 'md' && `empty-state--${size}`,
        className,
      )}
    >
      {resolvedIcon ? (
        <div className="empty-state-icon-wrap" aria-hidden="true">
          {resolvedIcon}
        </div>
      ) : null}
      <div className="empty-state-body">
        <Heading className="empty-state-title">{title}</Heading>
        {description ? (
          <div className="empty-state-description">{description}</div>
        ) : null}
      </div>
      {action ? <div className="empty-state-actions">{action}</div> : null}
      {children ?? null}
    </Card>
  );
}
