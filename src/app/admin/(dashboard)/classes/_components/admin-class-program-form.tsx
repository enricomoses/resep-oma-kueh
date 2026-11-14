'use client';

import { CheckCircle2 } from 'lucide-react';
import type { Dispatch, FormEvent, SetStateAction } from 'react';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CLASS_PROGRAM_STATUSES } from '@/constants/classes.constant';
import type { ClassProgramStatus, ProgramFormState } from '@/types/classes';
import { cn } from '@/utils';
import { slugifyClassTitle } from '@/utils/admin-classes';

import { AdminClassProgramCoverField } from './admin-class-program-cover-field';
import { AdminClassProgramMetricsFields } from './admin-class-program-metrics-fields';

interface AdminClassProgramFormProps {
  form: ProgramFormState;
  setForm: Dispatch<SetStateAction<ProgramFormState>>;
  slugTouched: boolean;
  setSlugTouched: (touched: boolean) => void;
  fieldErrors: Record<string, string[]>;
  isBusy: boolean;
  isUploading: boolean;
  onUploadCover: (file: File | null) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  className?: string;
}

/** Form for creating or editing baking class programs with cover photo and release readiness. */
export function AdminClassProgramForm({
  form,
  setForm,
  slugTouched,
  setSlugTouched,
  fieldErrors,
  isBusy,
  isUploading,
  onUploadCover,
  onSubmit,
  onClose,
  className,
}: AdminClassProgramFormProps) {
  return (
    <form
      className={cn('admin-classes-form', className)}
      onSubmit={onSubmit}
      noValidate
    >
      <div className="admin-classes-form-header">
        <h3 className="admin-panel-title">
          {form.id ? 'Edit Program Kelas' : 'Tambah Program Kelas'}
        </h3>
        <Button type="button" variant="secondary" size="sm" onClick={onClose}>
          Tutup Editor
        </Button>
      </div>

      <div className="admin-form-grid-2">
        <FormField
          id="class-program-title"
          label="Judul Program"
          error={fieldErrors.title?.[0]}
        >
          {(fieldProps) => (
            <Input
              {...fieldProps}
              value={form.title}
              onChange={(event) => {
                const title = event.target.value;
                setForm((prev) => ({
                  ...prev,
                  title,
                  slug:
                    !prev.id && !slugTouched
                      ? slugifyClassTitle(title)
                      : prev.slug,
                }));
              }}
              placeholder="Contoh: Little Baker Chiffon Class"
            />
          )}
        </FormField>

        <FormField
          id="class-program-slug"
          label="Slug Program (Permanen)"
          error={fieldErrors.slug?.[0]}
        >
          {(fieldProps) => (
            <Input
              {...fieldProps}
              value={form.slug}
              disabled={Boolean(form.id)}
              onChange={(event) => {
                setSlugTouched(true);
                setForm((prev) => ({
                  ...prev,
                  slug: event.target.value,
                }));
              }}
              placeholder="little-baker-chiffon-class"
            />
          )}
        </FormField>
      </div>

      <FormField
        id="class-program-short-desc"
        label="Ringkasan Singkat"
        error={fieldErrors.shortDescription?.[0]}
      >
        {(fieldProps) => (
          <Input
            {...fieldProps}
            value={form.shortDescription}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                shortDescription: event.target.value,
              }))
            }
            placeholder="Kelas menghias dan memanggang kue kecil bersama pendampingan dapur OMA."
          />
        )}
      </FormField>

      <FormField
        id="class-program-description"
        label="Deskripsi Lengkap Program (Wajib untuk Publikasi)"
        error={fieldErrors.description?.[0]}
      >
        {(fieldProps) => (
          <Textarea
            {...fieldProps}
            rows={3}
            value={form.description}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                description: event.target.value,
              }))
            }
          />
        )}
      </FormField>

      <AdminClassProgramMetricsFields
        form={form}
        setForm={setForm}
        fieldErrors={fieldErrors}
      />

      <FormField
        id="class-program-included"
        label="Fasilitas Termasuk (1 baris per poin)"
        error={fieldErrors.includedItems?.[0]}
      >
        {(fieldProps) => (
          <Textarea
            {...fieldProps}
            rows={3}
            value={form.includedItemsText}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                includedItemsText: event.target.value,
              }))
            }
            placeholder={
              'Bahan kue & peralatan dapur\nCelemek pinjaman\nHasil panggangan dibawa pulang'
            }
          />
        )}
      </FormField>

      <AdminClassProgramCoverField
        form={form}
        setForm={setForm}
        coverAltError={fieldErrors.coverAltText?.[0]}
        isBusy={isBusy}
        isUploading={isUploading}
        onUploadCover={onUploadCover}
      />

      <div className="admin-form-grid-2">
        <FormField
          id="class-program-status"
          label="Status Program"
          error={fieldErrors.status?.[0]}
        >
          {(fieldProps) => (
            <Select
              {...fieldProps}
              value={form.status}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  status: event.target.value as ClassProgramStatus,
                }))
              }
            >
              {CLASS_PROGRAM_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          )}
        </FormField>

        <div className="admin-form-actions-end">
          <Button type="submit" variant="primary" disabled={isBusy}>
            <CheckCircle2 size={16} aria-hidden="true" />
            {form.id ? 'Simpan Perubahan Program' : 'Buat Program'}
          </Button>
        </div>
      </div>
    </form>
  );
}
