import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Card } from '@/components/ui/card';
import '@/styles/components/stat-card.css';
import { cn } from '@/utils';

interface StatCardMetaItem {
  label: string;
  value: ReactNode;
}

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  badgeText?: string;
  badgeTone?: 'neutral' | 'accent' | 'success' | 'danger';
  metaItems?: readonly StatCardMetaItem[];
  href?: string;
  linkLabel?: string;
  footer?: ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon,
  badgeText,
  badgeTone = 'neutral',
  metaItems,
  href,
  linkLabel,
  footer,
  className,
}: StatCardProps) {
  const hasFooterContent =
    Boolean(metaItems && metaItems.length > 0) ||
    Boolean(href && linkLabel) ||
    Boolean(footer);

  return (
    <Card tone="surface" className={cn('admin-stat-card', className)}>
      <div className="admin-stat-head">
        <p className="admin-stat-label">{label}</p>
        {icon ? (
          <span className="admin-stat-icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}
      </div>

      <div className="admin-stat-body">
        <p className="admin-stat-value">{value}</p>
        {badgeText ? (
          <p
            className={cn(
              'admin-stat-status',
              `admin-stat-status--${badgeTone}`,
            )}
          >
            <span className="admin-stat-dot" aria-hidden="true" />
            <span>{badgeText}</span>
          </p>
        ) : null}
      </div>

      {hasFooterContent ? (
        <div className="admin-stat-footer">
          {metaItems && metaItems.length > 0 ? (
            <dl className="admin-stat-meta-list">
              {metaItems.map((item) => (
                <div key={item.label} className="admin-stat-meta-item">
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {href && linkLabel ? (
            <Link href={href} className="admin-stat-link">
              <span>{linkLabel}</span>
              <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          ) : null}

          {footer ?? null}
        </div>
      ) : null}
    </Card>
  );
}
