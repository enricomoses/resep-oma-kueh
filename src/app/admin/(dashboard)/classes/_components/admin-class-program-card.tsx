'use client';

import { Archive, GraduationCap, Pencil } from 'lucide-react';

import { StatusIndicator } from '@/components/common/status/status-indicator';
import { Button } from '@/components/ui/button';
import type {
  AdminClassProgramItem,
  ClassProgramStatus,
} from '@/types/classes';
import { cn, formatIdr } from '@/utils';
import { formatClassAgeRange } from '@/utils/classes';

interface AdminClassProgramCardProps {
  program: AdminClassProgramItem;
  isOwner: boolean;
  onEdit: (program: AdminClassProgramItem) => void;
  onArchive: (program: AdminClassProgramItem) => void;
  className?: string;
}

const PROGRAM_STATUS_TONE: Record<
  ClassProgramStatus,
  'neutral' | 'success' | 'danger'
> = {
  draft: 'neutral',
  published: 'success',
  archived: 'danger',
};

export function AdminClassProgramCard({
  program,
  isOwner,
  onEdit,
  onArchive,
  className,
}: AdminClassProgramCardProps) {
  return (
    <li className={cn('admin-classes-row', className)}>
      <div className="admin-classes-row-main">
        <div className="admin-classes-row-head">
          <h3 className="admin-classes-row-title">
            <GraduationCap size={16} aria-hidden="true" />
            <span>{program.title}</span>
          </h3>
          <StatusIndicator
            tone={PROGRAM_STATUS_TONE[program.status]}
            label={program.status}
          />
        </div>

        <p className="admin-classes-row-meta">
          /{program.slug} · {formatIdr(program.basePriceIdr)} ·{' '}
          {formatClassAgeRange(program.ageMin, program.ageMax)}
          {program.durationMinutes ? ` · ${program.durationMinutes} menit` : ''}
        </p>

        <div className="admin-classes-row-flags">
          <StatusIndicator
            tone={program.needsOwnerReview ? 'accent' : 'success'}
            label={
              program.needsOwnerReview
                ? 'Menunggu Review Owner'
                : 'Sudah Direview'
            }
          />
          <StatusIndicator
            tone={program.coverIsApproved ? 'success' : 'neutral'}
            label={
              program.coverIsApproved
                ? 'Foto Disetujui'
                : 'Foto Belum Disetujui'
            }
          />
        </div>

        {program.shortDescription ? (
          <p className="admin-row-subcopy">{program.shortDescription}</p>
        ) : null}
      </div>

      {isOwner ? (
        <div className="admin-classes-row-actions">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onEdit(program)}
          >
            <Pencil size={14} aria-hidden="true" />
            <span>Edit</span>
          </Button>
          {program.status !== 'archived' ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onArchive(program)}
            >
              <Archive size={14} aria-hidden="true" />
              <span>Arsipkan</span>
            </Button>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
