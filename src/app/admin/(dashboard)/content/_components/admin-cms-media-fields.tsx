'use client';

import { Trash2, Upload } from 'lucide-react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import type { CmsDraftFormState } from '@/types/admin-cms';
import { cn } from '@/utils';

interface AdminCmsMediaFieldsProps {
  form: CmsDraftFormState;
  isUploading: boolean;
  getError: (field: string) => string | undefined;
  onChangeForm: (next: CmsDraftFormState) => void;
  onUploadFile: (file: File | undefined) => void;
  className?: string;
}

export function AdminCmsMediaFields({
  form,
  isUploading,
  getError,
  onChangeForm,
  onUploadFile,
  className,
}: AdminCmsMediaFieldsProps) {
  return (
    <Card tone="surface" className={cn('admin-subpanel', className)}>
      <div className="admin-card-head">
        <div>
          <h4 className="admin-card-title">
            Media Brand (Bucket: brand-assets)
          </h4>
          <p className="admin-section-subtitle">
            {form.key === 'home.hero'
              ? 'Wajib mengunggah dan menyetujui foto sebelum publikasi Hero.'
              : 'Opsional; jika diisi saat publikasi wajib mencantumkan teks alt dan persetujuan.'}
          </p>
        </div>
        {form.imagePath ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              onChangeForm({
                ...form,
                imagePath: '',
                previewUrl: null,
                mediaApproved: false,
              })
            }
          >
            <Trash2 size={14} aria-hidden="true" />
            Hapus Media
          </Button>
        ) : null}
      </div>

      {form.previewUrl ? (
        <div className="relative h-44 w-full max-w-md overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border-sand)]">
          <Image
            src={form.previewUrl}
            alt={form.imageAlt || 'Pratinjau aset brand'}
            fill
            sizes="448px"
            unoptimized
            className="object-cover"
          />
        </div>
      ) : null}

      <div className="admin-form-grid admin-form-grid--two">
        <FormField
          id="cms-image-upload"
          label="Unggah Foto Baru (JPG/PNG/WebP/AVIF <= 5 MiB)"
          error={getError('image_path')}
        >
          {(fieldProps) => (
            <div className="admin-inline-actions">
              <input
                {...fieldProps}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={(e) => onUploadFile(e.target.files?.[0])}
                disabled={isUploading}
              />
              {isUploading ? (
                <span className="text-xs">
                  <Upload
                    size={14}
                    aria-hidden="true"
                    className="mr-1 inline"
                  />
                  Mengunggah...
                </span>
              ) : null}
            </div>
          )}
        </FormField>

        <FormField
          id="cms-image-alt"
          label="Teks Alt Foto"
          error={getError('image_alt')}
        >
          {(fieldProps) => (
            <Input
              {...fieldProps}
              value={form.imageAlt}
              onChange={(e) =>
                onChangeForm({
                  ...form,
                  imageAlt: e.target.value,
                })
              }
            />
          )}
        </FormField>
      </div>

      <label className="admin-checkbox-label">
        <input
          type="checkbox"
          checked={form.mediaApproved}
          onChange={(e) =>
            onChangeForm({
              ...form,
              mediaApproved: e.target.checked,
            })
          }
        />
        <span>Media disetujui Owner untuk dipublikasikan (media_approved)</span>
      </label>
    </Card>
  );
}
