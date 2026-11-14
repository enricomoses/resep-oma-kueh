'use client';

import { Upload } from 'lucide-react';
import Image from 'next/image';
import type { Dispatch, SetStateAction } from 'react';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import type { ProgramFormState } from '@/types/classes';

interface AdminClassProgramCoverFieldProps {
  form: ProgramFormState;
  setForm: Dispatch<SetStateAction<ProgramFormState>>;
  coverAltError?: string;
  isBusy: boolean;
  isUploading: boolean;
  onUploadCover: (file: File | null) => void;
}

/** Cover photo upload, thumbnail preview, alt text, consent check, and owner review toggles. */
export function AdminClassProgramCoverField({
  form,
  setForm,
  coverAltError,
  isBusy,
  isUploading,
  onUploadCover,
}: AdminClassProgramCoverFieldProps) {
  return (
    <div className="admin-classes-cover-box">
      <div className="admin-classes-cover-preview">
        {form.coverPreviewUrl && !form.clearCover ? (
          <Image
            src={form.coverPreviewUrl}
            alt={form.coverAltText || form.title || 'Preview sampul kelas'}
            width={180}
            height={120}
            unoptimized
            className="admin-classes-cover-thumb"
          />
        ) : (
          <div className="admin-classes-cover-empty">
            Belum ada sampul dipilih
          </div>
        )}
      </div>

      <div className="admin-classes-cover-fields">
        <label className="admin-upload-label">
          <Upload size={16} aria-hidden="true" />
          <span>
            {isUploading
              ? 'Mengunggah ke draft...'
              : 'Unggah Foto Sampul (JPG/PNG/WebP ≤ 5 MiB)'}
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={isBusy}
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              onUploadCover(file);
              event.target.value = '';
            }}
          />
        </label>

        <FormField
          id="class-program-cover-alt"
          label="Teks Alt Foto Sampul (Wajib untuk Publikasi)"
          error={coverAltError}
        >
          {(fieldProps) => (
            <Input
              {...fieldProps}
              value={form.coverAltText}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  coverAltText: event.target.value,
                }))
              }
              placeholder="Suasana kelas menghias kue di dapur Resep Oma Kueh"
            />
          )}
        </FormField>

        <div className="admin-classes-checkbox-group">
          <label className="admin-checkbox-label">
            <input
              type="checkbox"
              checked={form.coverIsApproved}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  coverIsApproved: event.target.checked,
                }))
              }
            />
            <span>
              Foto memiliki persetujuan publikasi peserta/wali
              (cover_is_approved)
            </span>
          </label>
          <label className="admin-checkbox-label">
            <input
              type="checkbox"
              checked={!form.needsOwnerReview}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  needsOwnerReview: !event.target.checked,
                }))
              }
            />
            <span>
              Review Owner selesai & siap rilis (needs_owner_review = false)
            </span>
          </label>
        </div>

        {form.coverPreviewUrl || form.draftCoverPath ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                draftCoverPath: null,
                clearCover: true,
                coverPreviewUrl: null,
                coverIsApproved: false,
              }))
            }
          >
            Hapus Foto Sampul
          </Button>
        ) : null}
      </div>
    </div>
  );
}
