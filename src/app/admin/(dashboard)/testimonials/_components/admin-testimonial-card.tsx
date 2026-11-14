import { Archive, CheckCircle2, Edit3, MessageSquareQuote } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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

  return (
    <Card tone="surface" className={cn('admin-entity-card', className)}>
      <div className="admin-card-head">
        <div className="admin-inline-actions">
          <Badge
            tone={
              item.status === 'published'
                ? 'success'
                : item.status === 'archived'
                  ? 'accent'
                  : 'neutral'
            }
          >
            {item.status === 'published'
              ? 'Terpublikasi'
              : item.status === 'archived'
                ? 'Diarsipkan'
                : 'Draf'}
          </Badge>
          <Badge tone={hasConsent ? 'success' : 'neutral'}>
            {hasConsent ? 'Izin Tercatat' : 'Belum Ada Izin'}
          </Badge>
          {item.rating !== null ? (
            <Badge tone="accent">{item.rating}/5</Badge>
          ) : (
            <Badge tone="neutral">Tanpa Rating</Badge>
          )}
        </div>
      </div>

      <h3 className="admin-card-title">
        <MessageSquareQuote
          size={16}
          aria-hidden="true"
          className="mr-1 inline"
        />
        {item.displayName}
      </h3>
      <blockquote className="home-testimonial-quote">“{item.quote}”</blockquote>
      <p className="admin-section-subtitle">
        Sumber: {item.sourceLabel ?? '—'}
        {hasConsent
          ? ` · Referensi Izin Privat (Owner): ${item.consentReference} (${toDateInputValue(item.consentAt)})`
          : ''}
      </p>

      <div className="admin-inline-actions">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onEdit(item)}
        >
          <Edit3 size={14} aria-hidden="true" />
          Ubah & Catat Izin
        </Button>
        {item.status === 'draft' && hasConsent ? (
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
