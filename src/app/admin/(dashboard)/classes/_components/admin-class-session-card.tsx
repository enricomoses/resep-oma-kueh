'use client';

import { Ban, Pencil } from 'lucide-react';

import { StatusIndicator } from '@/components/common/status/status-indicator';
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
    <li className={cn('admin-classes-row', className)}>
      <div className="admin-classes-row-main">
        <div className="admin-classes-row-head">
          <h3 className="admin-classes-row-title">{session.programTitle}</h3>
          <span className="admin-classes-branch-chip">
            {session.branchName}
            {!session.branchIsActive ? ' (Nonaktif)' : ''}
          </span>
          <StatusIndicator
            tone={SESSION_STATUS_TONE[session.status]}
            label={session.status}
          />
          <StatusIndicator
            tone={session.isRegistrationOpen ? 'success' : 'neutral'}
            label={
              session.isRegistrationOpen
                ? 'Pendaftaran Dibuka'
                : 'Pendaftaran Ditutup'
            }
          />
        </div>

        <p className="admin-classes-row-meta">
          {formatJakartaDateTimeDisplay(session.startsAt)} —{' '}
          {formatJakartaDateTimeDisplay(session.endsAt)}
          {session.registrationDeadlineAt
            ? ` · Batas daftar: ${formatJakartaDateTimeDisplay(session.registrationDeadlineAt)}`
            : ''}
        </p>

        <p className="admin-classes-row-meta">
          Tarif efektif: <strong>{formatIdr(session.effectivePriceIdr)}</strong>
          {session.priceOverrideIdr !== null
            ? ` (override cabang; dasar ${formatIdr(session.programBasePriceIdr)})`
            : ' (mengikuti harga dasar)'}{' '}
          · Kapasitas: <strong>{session.capacity}</strong> ·{' '}
          {session.seatsLeft === null
            ? 'Sisa kuota belum dirinci (estimasi manual)'
            : `${session.seatsLeft} kursi tersisa`}
        </p>
      </div>

      <div className="admin-classes-row-actions">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onEdit(session)}
          disabled={isBusy}
        >
          <Pencil size={14} aria-hidden="true" />
          <span>Edit</span>
        </Button>
        {session.status === 'scheduled' ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onMarkFull(session)}
            disabled={isBusy}
          >
            <span>Tandai Penuh</span>
          </Button>
        ) : null}
        {session.status !== 'cancelled' && session.status !== 'completed' ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onCancel(session)}
            disabled={isBusy}
          >
            <Ban size={14} aria-hidden="true" />
            <span>Batalkan Sesi</span>
          </Button>
        ) : null}
      </div>
    </li>
  );
}
