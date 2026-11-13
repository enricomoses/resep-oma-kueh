'use client';

import { Trash2, Upload } from 'lucide-react';
import Image from 'next/image';
import { type ChangeEvent, useState } from 'react';

import { MediaPlaceholder } from '@/app/_components';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
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
import { ADMIN_MEDIA_BUCKETS, formatMediaBytes } from '@/utils/admin-media';

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
          {images.map((img, idx) => {
            const previewUrl = previewUrlByImageId[img.id] ?? null;
            const prefix = `images.${idx}`;
            const isPublic =
              img.storageBucket === ADMIN_MEDIA_BUCKETS.PRODUCT_IMAGES;

            return (
              <Card key={img.id} className="admin-editor-image-card">
                <div className="admin-editor-image-preview">
                  {previewUrl ? (
                    <Image
                      src={previewUrl}
                      alt={img.altText || `Pratinjau foto ${idx + 1}`}
                      fill
                      sizes="160px"
                      unoptimized
                      className="admin-editor-image-el"
                    />
                  ) : (
                    <MediaPlaceholder
                      caption={img.altText ?? 'Pratinjau tidak tersedia'}
                      className="admin-editor-image-placeholder"
                    />
                  )}
                </div>

                <div className="admin-editor-image-fields">
                  <div className="admin-editor-item-header">
                    <div className="admin-inline-actions">
                      <Badge tone={isPublic ? 'success' : 'accent'}>
                        {isPublic
                          ? ADMIN_CATALOG_COPY.MEDIA.APPROVED_BADGE
                          : ADMIN_CATALOG_COPY.MEDIA.DRAFT_BADGE}
                      </Badge>
                      {img.isPrimary ? (
                        <Badge tone="neutral">Utama</Badge>
                      ) : null}
                      <code className="admin-row-meta">{img.storagePath}</code>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeImage(idx)}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                      <span>{ADMIN_CATALOG_COPY.MEDIA.REMOVE_IMAGE_BTN}</span>
                    </Button>
                  </div>

                  <div className="admin-form-row-2">
                    <FormField
                      label={ADMIN_CATALOG_COPY.MEDIA.ALT_LABEL}
                      required={img.isApproved}
                      error={fieldErrors[`${prefix}.altText`]?.[0]}
                    >
                      {(props) => (
                        <Input
                          {...props}
                          placeholder="Deskripsi foto untuk pembaca layar..."
                          value={img.altText ?? ''}
                          onChange={(e) =>
                            updateImage(idx, {
                              altText:
                                e.target.value.length > 0
                                  ? e.target.value
                                  : null,
                            })
                          }
                        />
                      )}
                    </FormField>

                    <FormField
                      label={ADMIN_CATALOG_COPY.MEDIA.VARIANT_LINK_LABEL}
                      error={fieldErrors[`${prefix}.variantId`]?.[0]}
                    >
                      {(props) => (
                        <Select
                          {...props}
                          value={img.variantId ?? ''}
                          onChange={(e) =>
                            updateImage(idx, {
                              variantId:
                                e.target.value.length > 0
                                  ? e.target.value
                                  : null,
                            })
                          }
                        >
                          <option value="">
                            {ADMIN_CATALOG_COPY.MEDIA.ALL_VARIANTS_OPTION}
                          </option>
                          {variants.map((variant) => (
                            <option key={variant.id} value={variant.id}>
                              {variant.name} ({variant.sku})
                            </option>
                          ))}
                        </Select>
                      )}
                    </FormField>
                  </div>

                  <div className="admin-form-row-3">
                    <FormField
                      label="Urutan Foto"
                      error={fieldErrors[`${prefix}.sortOrder`]?.[0]}
                    >
                      {(props) => (
                        <Input
                          {...props}
                          type="number"
                          min={0}
                          max={9999}
                          value={String(img.sortOrder)}
                          onChange={(e) => {
                            const parsed = Number.parseInt(e.target.value, 10);
                            updateImage(idx, {
                              sortOrder: Number.isFinite(parsed) ? parsed : 0,
                            });
                          }}
                        />
                      )}
                    </FormField>

                    <label className="admin-checkbox-label">
                      <input
                        type="checkbox"
                        checked={img.isPrimary}
                        onChange={(e) =>
                          updateImage(idx, { isPrimary: e.target.checked })
                        }
                      />
                      <span>{ADMIN_CATALOG_COPY.MEDIA.PRIMARY_LABEL}</span>
                    </label>

                    <label className="admin-checkbox-label">
                      <input
                        type="checkbox"
                        checked={img.isApproved}
                        onChange={(e) =>
                          updateImage(idx, { isApproved: e.target.checked })
                        }
                      />
                      <span>{ADMIN_CATALOG_COPY.MEDIA.PROMOTE_LABEL}</span>
                    </label>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
