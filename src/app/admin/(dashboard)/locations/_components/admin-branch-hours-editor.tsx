'use client';

import { Clock, RotateCcw } from 'lucide-react';
import { type FormEvent, useState } from 'react';

import { AdminSectionHeader } from '@/app/admin/(dashboard)/_components/admin-section-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import {
  ADMIN_CATALOG_COPY,
  ADMIN_DAY_OF_WEEK_LABELS,
} from '@/constants/admin-catalog.constant';
import type {
  AdminBranchItem,
  ReplaceBranchHoursInput,
} from '@/types/admin-catalog';
import { cn } from '@/utils';
import { validateWeeklyHoursIntervals } from '@/utils/admin-branches';
import { replaceBranchHoursSchema } from '@/validations/admin-catalog.schema';

interface DayDraft {
  dayOfWeek: number;
  isClosed: boolean;
  opensAt: string;
  closesAt: string;
  note: string;
}

interface AdminBranchHoursEditorProps {
  branch: AdminBranchItem;
  isPending: boolean;
  serverError: string | null;
  onSaveHours: (payload: ReplaceBranchHoursInput) => Promise<void>;
  className?: string;
}

function buildInitialDays(branch: AdminBranchItem): DayDraft[] {
  const byDay = new Map(branch.hours.map((item) => [item.dayOfWeek, item]));
  return ADMIN_DAY_OF_WEEK_LABELS.map((_, dayOfWeek) => {
    const existing = byDay.get(dayOfWeek);
    return {
      dayOfWeek,
      isClosed: existing?.isClosed ?? false,
      opensAt: existing?.opensAt ?? '',
      closesAt: existing?.closesAt ?? '',
      note: existing?.note ?? '',
    };
  });
}

function resolveDayPreview(day: DayDraft): string {
  if (day.isClosed) {
    return 'Tutup';
  }
  if (!day.opensAt.trim() && !day.closesAt.trim()) {
    return 'Sesuai konfirmasi';
  }
  if (day.opensAt.trim() && day.closesAt.trim()) {
    return `${day.opensAt.trim()} – ${day.closesAt.trim()}`;
  }
  return 'Belum lengkap';
}

export function AdminBranchHoursEditor({
  branch,
  isPending,
  serverError,
  onSaveHours,
  className,
}: AdminBranchHoursEditorProps) {
  const [days, setDays] = useState<DayDraft[]>(() => buildInitialDays(branch));
  const [validationError, setValidationError] = useState<string | null>(null);
  const [dayErrors, setDayErrors] = useState<Record<number, string>>({});

  function updateDay(dayOfWeek: number, patch: Partial<DayDraft>) {
    setDays((prev) =>
      prev.map((item) =>
        item.dayOfWeek === dayOfWeek ? { ...item, ...patch } : item,
      ),
    );
    setDayErrors((prev) => {
      if (!(dayOfWeek in prev)) {
        return prev;
      }
      const next = { ...prev };
      delete next[dayOfWeek];
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);
    setDayErrors({});

    const normalizedPayload: ReplaceBranchHoursInput = {
      expectedUpdatedAt: branch.updatedAt,
      hours: days.map((item) => ({
        dayOfWeek: item.dayOfWeek,
        isClosed: item.isClosed,
        opensAt: item.isClosed ? null : item.opensAt.trim() || null,
        closesAt: item.isClosed ? null : item.closesAt.trim() || null,
        note: item.note.trim() ? item.note.trim() : null,
      })),
    };

    const issues = validateWeeklyHoursIntervals(normalizedPayload.hours);
    if (issues.length > 0) {
      const nextErrors: Record<number, string> = {};
      for (const issue of issues) {
        if (issue.dayOfWeek === null) {
          continue;
        }
        if (issue.code === 'invalid_closed_hours') {
          nextErrors[issue.dayOfWeek] =
            ADMIN_CATALOG_COPY.LOCATIONS.ERRORS.INVALID_CLOSED_HOURS;
        } else if (issue.code === 'incomplete_hours') {
          nextErrors[issue.dayOfWeek] =
            ADMIN_CATALOG_COPY.LOCATIONS.ERRORS.INCOMPLETE_HOURS;
        } else if (issue.code === 'invalid_overnight_range') {
          nextErrors[issue.dayOfWeek] =
            ADMIN_CATALOG_COPY.LOCATIONS.ERRORS.INVALID_OVERNIGHT_RANGE;
        } else if (issue.code === 'invalid_time_format') {
          nextErrors[issue.dayOfWeek] =
            'Gunakan format jam HH:MM (mis. 09:00).';
        }
      }
      setDayErrors(nextErrors);
      setValidationError(
        Object.values(nextErrors)[0] ??
          'Periksa kembali jadwal operasional 7 hari.',
      );
      return;
    }

    const parsed = replaceBranchHoursSchema.safeParse(normalizedPayload);
    if (!parsed.success) {
      setValidationError(
        parsed.error.issues[0]?.message ??
          'Format jadwal operasional tidak valid.',
      );
      return;
    }

    await onSaveHours(parsed.data);
  }

  return (
    <Card tone="surface" className={cn('admin-locations-panel', className)}>
      <AdminSectionHeader
        headingAs="h3"
        titleClassName="admin-row-title"
        title={
          <>
            <Clock size={18} aria-hidden="true" />{' '}
            <span>Jam Operasional Mingguan ({branch.name})</span>
          </>
        }
        description={ADMIN_CATALOG_COPY.LOCATIONS.UNKNOWN_HOURS_HINT}
        actions={
          <Badge
            tone={branch.readiness.hasVerifiedHours ? 'success' : 'neutral'}
          >
            {branch.readiness.hasVerifiedHours
              ? 'Sebagian/Semua Hari Terisi'
              : 'Belum Dikonfirmasi'}
          </Badge>
        }
      />

      {validationError ? (
        <Feedback tone="error" title={validationError} announce />
      ) : null}

      {serverError ? (
        <Feedback tone="error" title={serverError} announce />
      ) : null}

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="admin-hours-form"
      >
        <div className="admin-hours-list">
          {days.map((day) => {
            const label = ADMIN_DAY_OF_WEEK_LABELS[day.dayOfWeek] ?? '';
            const dayError = dayErrors[day.dayOfWeek];
            return (
              <div key={day.dayOfWeek} className="admin-hours-row">
                <div className="admin-hours-day-header">
                  <strong>{label}</strong>
                  <Badge tone={day.isClosed ? 'neutral' : 'accent'}>
                    {resolveDayPreview(day)}
                  </Badge>
                </div>

                <div className="admin-hours-controls">
                  <label className="admin-checkbox-label">
                    <input
                      type="checkbox"
                      checked={day.isClosed}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        updateDay(day.dayOfWeek, {
                          isClosed: checked,
                          opensAt: checked ? '' : day.opensAt,
                          closesAt: checked ? '' : day.closesAt,
                        });
                      }}
                    />
                    <span>Tutup</span>
                  </label>

                  <FormField
                    id={`hour-open-${branch.id}-${day.dayOfWeek}`}
                    label={`Buka (${label})`}
                    error={dayError}
                  >
                    {(fieldProps) => (
                      <Input
                        {...fieldProps}
                        type="text"
                        inputMode="numeric"
                        placeholder="09:00"
                        value={day.opensAt}
                        disabled={day.isClosed}
                        onChange={(event) =>
                          updateDay(day.dayOfWeek, {
                            opensAt: event.target.value,
                          })
                        }
                      />
                    )}
                  </FormField>

                  <FormField
                    id={`hour-close-${branch.id}-${day.dayOfWeek}`}
                    label={`Tutup (${label})`}
                  >
                    {(fieldProps) => (
                      <Input
                        {...fieldProps}
                        type="text"
                        inputMode="numeric"
                        placeholder="17:00"
                        value={day.closesAt}
                        disabled={day.isClosed}
                        onChange={(event) =>
                          updateDay(day.dayOfWeek, {
                            closesAt: event.target.value,
                          })
                        }
                      />
                    )}
                  </FormField>

                  <FormField
                    id={`hour-note-${branch.id}-${day.dayOfWeek}`}
                    label={`Catatan (${label})`}
                  >
                    {(fieldProps) => (
                      <Input
                        {...fieldProps}
                        type="text"
                        placeholder="Opsional, mis. Jam pickup"
                        value={day.note}
                        onChange={(event) =>
                          updateDay(day.dayOfWeek, { note: event.target.value })
                        }
                      />
                    )}
                  </FormField>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      updateDay(day.dayOfWeek, {
                        isClosed: false,
                        opensAt: '',
                        closesAt: '',
                      })
                    }
                  >
                    <RotateCcw size={14} aria-hidden="true" />
                    <span>Belum Konfirmasi</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="admin-inline-actions">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={isPending}
            loadingLabel="Menyimpan jam operasional..."
          >
            <span>Simpan Jam Mingguan</span>
          </Button>
        </div>
      </form>
    </Card>
  );
}
