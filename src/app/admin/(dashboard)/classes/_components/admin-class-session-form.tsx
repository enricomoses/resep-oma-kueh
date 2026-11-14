'use client';

import { CalendarClock } from 'lucide-react';
import type { Dispatch, FormEvent, SetStateAction } from 'react';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { CLASS_SESSION_STATUSES } from '@/constants/classes.constant';
import type {
  AdminClassBranchOption,
  AdminClassProgramItem,
  ClassSessionStatus,
  SessionFormState,
} from '@/types/classes';
import { cn, formatIdr } from '@/utils';

interface AdminClassSessionFormProps {
  form: SessionFormState;
  setForm: Dispatch<SetStateAction<SessionFormState>>;
  isOwner: boolean;
  isBranchLocked: boolean;
  selectablePrograms: AdminClassProgramItem[];
  branches: AdminClassBranchOption[];
  fieldErrors: Record<string, string[]>;
  isBusy: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  className?: string;
}

export function AdminClassSessionForm({
  form,
  setForm,
  isOwner,
  isBranchLocked,
  selectablePrograms,
  branches,
  fieldErrors,
  isBusy,
  onSubmit,
  onClose,
  className,
}: AdminClassSessionFormProps) {
  return (
    <form
      className={cn('admin-classes-form', className)}
      onSubmit={onSubmit}
      noValidate
    >
      <div className="admin-classes-form-header">
        <h3 className="admin-panel-title">
          {form.id ? 'Edit Sesi Cabang' : 'Tambah Sesi Cabang Baru'}
        </h3>
        <Button type="button" variant="secondary" size="sm" onClick={onClose}>
          Tutup Form Sesi
        </Button>
      </div>

      <div className="admin-form-grid-2">
        <FormField
          id="class-session-program"
          label="Program Kelas"
          error={fieldErrors.programId?.[0]}
        >
          {(fieldProps) => (
            <Select
              {...fieldProps}
              value={form.programId}
              disabled={Boolean(form.id)}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  programId: event.target.value,
                }))
              }
            >
              <option value="">Pilih program kelas</option>
              {selectablePrograms.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.title} ({formatIdr(program.basePriceIdr)})
                </option>
              ))}
            </Select>
          )}
        </FormField>

        <FormField
          id="class-session-branch"
          label="Cabang Pelaksana"
          error={fieldErrors.branchId?.[0]}
        >
          {(fieldProps) => (
            <Select
              {...fieldProps}
              value={form.branchId}
              disabled={Boolean(form.id) || isBranchLocked}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  branchId: event.target.value,
                }))
              }
            >
              <option value="">Pilih cabang</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} ({branch.city})
                </option>
              ))}
            </Select>
          )}
        </FormField>
      </div>

      <div className="admin-form-grid-3">
        <FormField
          id="class-session-starts"
          label="Waktu Mulai (WIB)"
          error={fieldErrors.startsAt?.[0]}
        >
          {(fieldProps) => (
            <Input
              {...fieldProps}
              type="datetime-local"
              value={form.startsAtLocal}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  startsAtLocal: event.target.value,
                }))
              }
            />
          )}
        </FormField>

        <FormField
          id="class-session-ends"
          label="Waktu Selesai (WIB)"
          error={fieldErrors.endsAt?.[0]}
        >
          {(fieldProps) => (
            <Input
              {...fieldProps}
              type="datetime-local"
              value={form.endsAtLocal}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  endsAtLocal: event.target.value,
                }))
              }
            />
          )}
        </FormField>

        <FormField
          id="class-session-deadline"
          label="Batas Pendaftaran (WIB, Opsional)"
          error={fieldErrors.registrationDeadlineAt?.[0]}
        >
          {(fieldProps) => (
            <Input
              {...fieldProps}
              type="datetime-local"
              value={form.deadlineAtLocal}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  deadlineAtLocal: event.target.value,
                }))
              }
            />
          )}
        </FormField>
      </div>

      <div className="admin-form-grid-4">
        <FormField
          id="class-session-capacity"
          label="Kapasitas Total"
          error={fieldErrors.capacity?.[0]}
        >
          {(fieldProps) => (
            <Input
              {...fieldProps}
              type="number"
              min={1}
              value={form.capacity}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  capacity: event.target.value,
                }))
              }
            />
          )}
        </FormField>

        <FormField
          id="class-session-seats-left"
          label="Sisa Kuota Manual (Kosong = Tidak Diketahui)"
          error={fieldErrors.seatsLeft?.[0]}
        >
          {(fieldProps) => (
            <Input
              {...fieldProps}
              type="number"
              min={0}
              placeholder="Kosongkan jika belum pasti"
              value={form.seatsLeft}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  seatsLeft: event.target.value,
                }))
              }
            />
          )}
        </FormField>

        <FormField
          id="class-session-price-override"
          label={
            isOwner
              ? 'Override Harga Cabang (IDR, Opsional)'
              : 'Override Harga (Terkunci · Owner Only)'
          }
          error={fieldErrors.priceOverrideIdr?.[0]}
        >
          {(fieldProps) => (
            <Input
              {...fieldProps}
              type="number"
              min={1000}
              step={1000}
              disabled={!isOwner}
              placeholder={
                isOwner
                  ? 'Ikuti harga dasar program'
                  : 'Mengikuti harga dasar / aturan Owner'
              }
              value={form.priceOverrideIdr}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  priceOverrideIdr: event.target.value,
                }))
              }
            />
          )}
        </FormField>

        <FormField
          id="class-session-status"
          label="Status Sesi"
          error={fieldErrors.status?.[0]}
        >
          {(fieldProps) => (
            <Select
              {...fieldProps}
              value={form.status}
              onChange={(event) => {
                const nextStatus = event.target.value as ClassSessionStatus;
                setForm((prev) => ({
                  ...prev,
                  status: nextStatus,
                  isRegistrationOpen:
                    nextStatus === 'scheduled'
                      ? prev.isRegistrationOpen
                      : false,
                }));
              }}
            >
              {CLASS_SESSION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          )}
        </FormField>
      </div>

      <div className="admin-form-grid-2">
        <label className="admin-checkbox-label">
          <input
            type="checkbox"
            checked={form.isRegistrationOpen}
            disabled={form.status !== 'scheduled'}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                isRegistrationOpen: event.target.checked,
              }))
            }
          />
          <span>Buka pendaftaran WhatsApp publik (is_registration_open)</span>
        </label>

        <div className="admin-form-actions-end">
          <Button type="submit" variant="primary" disabled={isBusy}>
            <CalendarClock size={16} aria-hidden="true" />
            {form.id ? 'Simpan Perubahan Sesi' : 'Buat Sesi Cabang'}
          </Button>
        </div>
      </div>
    </form>
  );
}
