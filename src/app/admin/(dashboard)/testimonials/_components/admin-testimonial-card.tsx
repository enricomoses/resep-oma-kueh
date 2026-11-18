import { Archive, CheckCircle2, Pencil } from 'lucide-react';

import { StatusIndicator } from '@/components/common/status/status-indicator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AdminTestimonialItem } from '@/types/admin-cms';
import { cn } from '@/utils';

function toDateInputValue(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

interface AdminTestimonialCardProps {
  item: AdminTestimonialItem;
  onEdit: (item: AdminTestimonialItem) => void;
  onPublish: (item: AdminTestimonialItem) => void;
  onArchive: (item: AdminTestimonialItem) => void;
  className?: string;
}

export function AdminTestimonialCard({
  item,
  onEdit,
  onPublish,
  onArchive,
  className,
}: AdminTestimonialCardProps) {
  const hasConsent = Boolean(item.consentAt && item.consentReference);
  const statusTone =
    item.status === 'published'
      ? 'success'
      : item.status === 'archived'
        ? 'neutral'
        : 'accent';
  const statusLabel =
    item.status === 'published'
      ? 'Terpublikasi'
      : item.status === 'archived'
        ? 'Diarsipkan'
        : 'Draf';

  return (
    <li className={cn('admin-testi-row', className)}>
      <div className="admin-testi-main">
        <div className="admin-testi-meta">
          <h3 className="admin-testi-author admin-wrap-text">
            {item.displayName}
          </h3>
          <StatusIndicator tone={statusTone} label={statusLabel} />
          <StatusIndicator
            tone={hasConsent ? 'success' : 'neutral'}
            label={hasConsent ? 'Izin Tercatat' : 'Belum Ada Izin'}
          />
          {item.rating !== null ? (
            <Badge tone="accent">{item.rating}/5</Badge>
          ) : (
            <Badge tone="neutral">Tanpa Rating</Badge>
          )}
        </div>

        <blockquote className="admin-testi-quote admin-wrap-text">
          “{item.quote}”
        </blockquote>

        <p className="admin-testi-source admin-wrap-text">
          Sumber: {item.sourceLabel ?? '—'}
          {hasConsent
            ? ` · Referensi Izin Privat (Owner): ${item.consentReference} (${toDateInputValue(item.consentAt)})`
            : ''}
        </p>
      </div>

      <div className="admin-testi-actions">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onEdit(item)}
        >
          <Pencil size={14} aria-hidden="true" />
          <span>Ubah &amp; Catat Izin</span>
        </Button>
        {item.status === 'draft' && hasConsent ? (
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
