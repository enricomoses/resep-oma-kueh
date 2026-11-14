'use client';

import { Upload } from 'lucide-react';
import { type ChangeEvent, useState } from 'react';

import { Feedback } from '@/components/ui/feedback';
import {
  ADMIN_CATALOG_COPY,
  ADMIN_MEDIA_LIMITS,
} from '@/constants/admin-catalog.constant';
import { useUploadAdminProductMedia } from '@/hooks/use-admin-catalog';
import { ApiClientError } from '@/lib/errors';
import type {
  AdminConfigImage,
  AdminConfigVariant,
} from '@/types/admin-catalog';
import { cn } from '@/utils';
import { formatMediaBytes } from '@/utils/admin-media';

import { AdminProductImageCard } from './admin-product-image-card';

interface AdminProductImagesSectionProps {
  images: AdminConfigImage[];
  previewUrlByImageId: Record<string, string | null>;
  variants: AdminConfigVariant[];
  fieldErrors: Record<string, string[]>;
  onChange: (
    nextImages: AdminConfigImage[],
    nextPreviewUrls?: Record<string, string | null>,
  ) => void;
  className?: string;
}

/** Product photo uploader and approval management list for the product editor. */
export function AdminProductImagesSection({
  images,
  previewUrlByImageId,
  variants,
  fieldErrors,
  onChange,
  className,
}: AdminProductImagesSectionProps) {
  const uploadMutation = useUploadAdminProductMedia();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  async function handleFileSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploadError(null);
    setUploadNotice(null);

    if (file.size > ADMIN_MEDIA_LIMITS.MAX_FILE_BYTES) {
      setUploadError(ADMIN_CATALOG_COPY.MEDIA.ERRORS.FILE_TOO_LARGE);
      return;
    }

    try {
      const response = await uploadMutation.mutateAsync(file);
      const newImageId = crypto.randomUUID();
      const newImage: AdminConfigImage = {
        id: newImageId,
        variantId: null,
        storageBucket: response.data.storageBucket,
        storagePath: response.data.storagePath,
        altText: null,
        isApproved: false,
        isPrimary: images.length === 0,
        sortOrder: (images.length + 1) * 10,
      };

      onChange([...images, newImage], {
        ...previewUrlByImageId,
        [newImageId]: response.data.previewUrl,
      });
      setUploadNotice(
        `Unggah berhasil ke bucket privat (${response.data.width}×${response.data.height}px, ${formatMediaBytes(response.data.byteSize)}). Lengkapi alt text lalu centang persetujuan untuk mempromosikan ke bucket publik.`,
      );
    } catch (err) {
      setUploadError(
        err instanceof ApiClientError
          ? err.message
          : 'Gagal mengunggah berkas foto.',
      );
    }
  }

  function updateImage(idx: number, patch: Partial<AdminConfigImage>) {
    const next = images.map((img, itemIdx) => {
      if (patch.isPrimary && itemIdx !== idx) {
        return { ...img, isPrimary: false };
      }
      if (itemIdx !== idx) return img;
      return { ...img, ...patch };
    });
    onChange(next);
  }

  function removeImage(idx: number) {
    const target = images[idx];
    const next = images.filter((_, itemIdx) => itemIdx !== idx);
    if (next.length > 0 && target?.isPrimary) {
      next[0] = { ...next[0], isPrimary: true };
    }
    onChange(next);
  }

  return (
    <section
      className={cn('admin-editor-section', className)}
      aria-labelledby="images-section-heading"
    >
      <div className="admin-section-header">
        <div>
          <h3 id="images-section-heading" className="admin-editor-heading">
            {ADMIN_CATALOG_COPY.MEDIA.SECTION_TITLE}
          </h3>
          <p className="admin-row-meta">
            Unggahan baru masuk ke bucket privat <code>media-drafts</code> dan
            hanya dipromosikan ke <code>product-images</code> bila disetujui
            beserta teks alt.
          </p>
        </div>

        <label className="admin-upload-trigger">
          <Upload size={16} aria-hidden="true" />
          <span>
            {uploadMutation.isPending
              ? ADMIN_CATALOG_COPY.MEDIA.UPLOAD_PENDING
              : ADMIN_CATALOG_COPY.MEDIA.UPLOAD_LABEL}
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            disabled={uploadMutation.isPending}
            onChange={(e) => {
              void handleFileSelect(e);
            }}
            className="sr-only"
          />
        </label>
      </div>

      {fieldErrors.images?.[0] ? (
        <Feedback tone="error" title={fieldErrors.images[0]} announce />
      ) : null}

      {uploadError ? (
        <Feedback tone="error" title={uploadError} announce />
      ) : null}

      {uploadNotice ? (
        <Feedback tone="success" title={uploadNotice} announce />
      ) : null}

      {images.length === 0 ? (
        <Feedback tone="info" title="Belum ada foto produk">
          Unggah minimal satu foto berkualitas tinggi dan beri alt text untuk
          dapat mempublikasikan produk.
        </Feedback>
      ) : (
        <div className="admin-editor-stack">
          {images.map((img, idx) => (
            <AdminProductImageCard
              key={img.id}
              image={img}
              index={idx}
              previewUrl={previewUrlByImageId[img.id] ?? null}
              variants={variants}
              fieldErrors={fieldErrors}
              onUpdate={(patch) => updateImage(idx, patch)}
              onRemove={() => removeImage(idx)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
