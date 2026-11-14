'use client';

import { Edit3, GraduationCap, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
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
    <div className={cn('admin-classes-row-card', className)}>
      <div className="admin-classes-row-main">
        <div className="admin-classes-row-badges">
          <Badge tone={PROGRAM_STATUS_TONE[program.status]}>
            {program.status}
          </Badge>
          <Badge tone={program.needsOwnerReview ? 'accent' : 'success'}>
            {program.needsOwnerReview
              ? 'Menunggu Review Owner'
              : 'Sudah Direview'}
          </Badge>
          <Badge tone={program.coverIsApproved ? 'success' : 'neutral'}>
            {program.coverIsApproved
              ? 'Foto Disetujui'
              : 'Foto Belum Disetujui'}
          </Badge>
        </div>
        <h3 className="admin-row-title">
          <GraduationCap size={16} aria-hidden="true" />
          <span>{program.title}</span>
        </h3>
        <p className="admin-row-meta">
          /{program.slug} · {formatIdr(program.basePriceIdr)} ·{' '}
          {formatClassAgeRange(program.ageMin, program.ageMax)}
          {program.durationMinutes ? ` · ${program.durationMinutes} menit` : ''}
        </p>
        {program.shortDescription ? (
          <p className="admin-row-subcopy">{program.shortDescription}</p>
        ) : null}
      </div>

      {isOwner ? (
        <div className="admin-inline-actions">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onEdit(program)}
          >
            <Edit3 size={15} aria-hidden="true" />
            Edit
          </Button>
          {program.status !== 'archived' ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onArchive(program)}
            >
              <Trash2 size={15} aria-hidden="true" />
              Arsipkan
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
