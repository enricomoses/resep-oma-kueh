import { Archive, CheckCircle2, Edit3, HelpCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { AdminFaqItem, AdminPublishingStatus } from '@/types/admin-cms';
import { cn } from '@/utils';

const STATUS_BADGE_MAP: Record<
  AdminPublishingStatus,
  { label: string; tone: 'neutral' | 'success' | 'accent' }
> = {
  draft: { label: 'Draf', tone: 'neutral' },
  published: { label: 'Terpublikasi', tone: 'success' },
  archived: { label: 'Diarsipkan', tone: 'accent' },
};

interface AdminFaqCardProps {
  item: AdminFaqItem;
  onEdit: (item: AdminFaqItem) => void;
  onPublish: (item: AdminFaqItem) => void;
  onArchive: (item: AdminFaqItem) => void;
  className?: string;
}

export function AdminFaqCard({
  item,
  onEdit,
  onPublish,
  onArchive,
  className,
}: AdminFaqCardProps) {
  const badge = STATUS_BADGE_MAP[item.status];

  return (
    <Card tone="surface" className={cn('admin-entity-card', className)}>
      <div className="admin-card-head">
        <div className="admin-inline-actions">
          <Badge tone="neutral">{item.category}</Badge>
          <Badge tone={badge.tone}>{badge.label}</Badge>
          <Badge tone="neutral">Urutan {item.sortOrder}</Badge>
        </div>
      </div>

      <h3 className="admin-card-title">
        <HelpCircle size={16} aria-hidden="true" className="mr-1 inline" />
        {item.question}
      </h3>
      <p className="admin-section-subtitle">{item.answer}</p>

      <div className="admin-inline-actions">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onEdit(item)}
        >
          <Edit3 size={14} aria-hidden="true" />
          Ubah
        </Button>
        {item.status === 'draft' ? (
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => onPublish(item)}
          >
            <CheckCircle2 size={14} aria-hidden="true" />
            Publikasikan
          </Button>
        ) : null}
        {item.status !== 'archived' ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onArchive(item)}
          >
            <Archive size={14} aria-hidden="true" />
            Arsipkan
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
