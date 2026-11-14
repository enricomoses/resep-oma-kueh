import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/utils';

interface StatCardProps {
  label: string;
  value: ReactNode;
  badgeText?: string;
  badgeTone?: 'neutral' | 'accent' | 'success' | 'danger';
  footer?: ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  badgeText,
  badgeTone = 'neutral',
  footer,
  className,
}: StatCardProps) {
  return (
    <Card tone="surface" className={cn('admin-stat-card', className)}>
      <p className="admin-stat-label">{label}</p>
      <p className="admin-stat-value">{value}</p>
      {badgeText ? <Badge tone={badgeTone}>{badgeText}</Badge> : null}
      {footer ?? null}
    </Card>
  );
}
