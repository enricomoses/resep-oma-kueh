'use client';

import { Ban, Edit3 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type {
  AdminClassSessionItem,
  ClassSessionStatus,
} from '@/types/classes';
import { cn, formatIdr } from '@/utils';
import { formatJakartaDateTimeDisplay } from '@/utils/admin-promotions';

interface AdminClassSessionCardProps {
  session: AdminClassSessionItem;
  isBusy: boolean;
  onEdit: (session: AdminClassSessionItem) => void;
  onMarkFull: (session: AdminClassSessionItem) => void;
  onCancel: (session: AdminClassSessionItem) => void;
  className?: string;
}

const SESSION_STATUS_TONE: Record<
  ClassSessionStatus,
  'success' | 'accent' | 'danger' | 'neutral'
> = {
  scheduled: 'success',
  full: 'accent',
  cancelled: 'danger',
  completed: 'neutral',
};

export function AdminClassSessionCard({
  session,
  isBusy,
  onEdit,
  onMarkFull,
  onCancel,
  className,
}: AdminClassSessionCardProps) {
  return (
    <div className={cn('admin-classes-row-card', className)}>
      <div className="admin-classes-row-main">
        <div className="admin-classes-row-badges">
          <Badge tone={SESSION_STATUS_TONE[session.status]}>
            {session.status}
          </Badge>
          <Badge tone={session.isRegistrationOpen ? 'success' : 'neutral'}>
            {session.isRegistrationOpen
              ? 'Pendaftaran Dibuka'
              : 'Pendaftaran Ditutup'}
          </Badge>
          <Badge tone={session.branchIsActive ? 'neutral' : 'danger'}>
            {session.branchName}
          </Badge>
        </div>
        <h3 className="admin-row-title">{session.programTitle}</h3>
        <p className="admin-row-meta">
          {formatJakartaDateTimeDisplay(session.startsAt)} —{' '}
          {formatJakartaDateTimeDisplay(session.endsAt)}
          {session.registrationDeadlineAt
            ? ` · Batas daftar: ${formatJakartaDateTimeDisplay(session.registrationDeadlineAt)}`
            : ''}
        </p>
        <p className="admin-row-subcopy">
          Tarif efektif: {formatIdr(session.effectivePriceIdr)}
          {session.priceOverrideIdr !== null
            ? ` (override cabang; dasar ${formatIdr(session.programBasePriceIdr)})`
            : ' (mengikuti harga dasar)'}{' '}
          · Kapasitas: {session.capacity} ·{' '}
          {session.seatsLeft === null
            ? 'Sisa kuota belum dirinci (estimasi manual)'
            : `${session.seatsLeft} kursi tersisa`}
        </p>
      </div>

      <div className="admin-inline-actions">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onEdit(session)}
          disabled={isBusy}
        >
          <Edit3 size={15} aria-hidden="true" />
          Edit
        </Button>
        {session.status === 'scheduled' ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onMarkFull(session)}
            disabled={isBusy}
          >
            Tandai Penuh
          </Button>
        ) : null}
        {session.status !== 'cancelled' && session.status !== 'completed' ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onCancel(session)}
            disabled={isBusy}
          >
            <Ban size={15} aria-hidden="true" />
            Batalkan Sesi
          </Button>
        ) : null}
      </div>
    </div>
  );
}
