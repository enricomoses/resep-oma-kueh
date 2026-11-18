import { Archive, CheckCircle2, Pencil } from 'lucide-react';

import { StatusIndicator } from '@/components/common/status/status-indicator';
import { Button } from '@/components/ui/button';
import type { AdminFaqItem, AdminPublishingStatus } from '@/types/admin-cms';
import { cn } from '@/utils';

const STATUS_MAP: Record<
  AdminPublishingStatus,
  { label: string; tone: 'neutral' | 'success' | 'accent' }
> = {
  draft: { label: 'Draf', tone: 'accent' },
  published: { label: 'Terpublikasi', tone: 'success' },
  archived: { label: 'Diarsipkan', tone: 'neutral' },
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
  const statusInfo = STATUS_MAP[item.status];

  return (
    <li className={cn('admin-faq-row', className)}>
      <div className="admin-faq-main">
        <div className="admin-faq-meta">
          <span className="admin-faq-category">{item.category}</span>
          <StatusIndicator tone={statusInfo.tone} label={statusInfo.label} />
          <span className="admin-faq-sort">Urutan #{item.sortOrder}</span>
        </div>

        <h3 className="admin-faq-question admin-wrap-text">{item.question}</h3>
        <p className="admin-faq-answer admin-wrap-text">{item.answer}</p>
      </div>

      <div className="admin-faq-actions">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onEdit(item)}
        >
          <Pencil size={14} aria-hidden="true" />
          <span>Ubah</span>
        </Button>
        {item.status === 'draft' ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onPublish(item)}
          >
            <CheckCircle2 size={14} aria-hidden="true" />
            <span>Publikasikan</span>
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
            <span>Arsipkan</span>
          </Button>
        ) : null}
      </div>
    </li>
  );
}
