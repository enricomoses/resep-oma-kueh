'use client';

import { Trash2 } from 'lucide-react';
import Image from 'next/image';

import { MediaPlaceholder } from '@/components/common/media-placeholder';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import type {
  AdminConfigImage,
  AdminConfigVariant,
} from '@/types/admin-catalog';
import { ADMIN_MEDIA_BUCKETS } from '@/utils/admin-media';

interface AdminProductImageCardProps {
  image: AdminConfigImage;
  index: number;
  previewUrl: string | null;
  variants: AdminConfigVariant[];
  fieldErrors: Record<string, string[]>;
  onUpdate: (patch: Partial<AdminConfigImage>) => void;
  onRemove: () => void;
}

/** Single product photo card with preview, alt text, variant link, sort order, and approval flags. */
export function AdminProductImageCard({
  image,
  index,
  previewUrl,
  variants,
  fieldErrors,
  onUpdate,
  onRemove,
}: AdminProductImageCardProps) {
  const prefix = `images.${index}`;
  const isPublic = image.storageBucket === ADMIN_MEDIA_BUCKETS.PRODUCT_IMAGES;

  return (
    <Card className="admin-editor-image-card">
      <div className="admin-editor-image-preview">
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt={image.altText || `Pratinjau foto ${index + 1}`}
            fill
            sizes="160px"
            unoptimized
            className="admin-editor-image-el"
          />
        ) : (
          <MediaPlaceholder
            caption={image.altText ?? 'Pratinjau tidak tersedia'}
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
            {image.isPrimary ? <Badge tone="neutral">Utama</Badge> : null}
            <code className="admin-row-meta">{image.storagePath}</code>
          </div>

          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            <Trash2 size={14} aria-hidden="true" />
            <span>{ADMIN_CATALOG_COPY.MEDIA.REMOVE_IMAGE_BTN}</span>
          </Button>
        </div>

        <div className="admin-form-row-2">
          <FormField
            label={ADMIN_CATALOG_COPY.MEDIA.ALT_LABEL}
            required={image.isApproved}
            error={fieldErrors[`${prefix}.altText`]?.[0]}
          >
            {(props) => (
              <Input
                {...props}
                placeholder="Deskripsi foto untuk pembaca layar..."
                value={image.altText ?? ''}
                onChange={(e) =>
                  onUpdate({
                    altText: e.target.value.length > 0 ? e.target.value : null,
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
                value={image.variantId ?? ''}
                onChange={(e) =>
                  onUpdate({
                    variantId:
                      e.target.value.length > 0 ? e.target.value : null,
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
                value={String(image.sortOrder)}
                onChange={(e) => {
                  const parsed = Number.parseInt(e.target.value, 10);
                  onUpdate({
                    sortOrder: Number.isFinite(parsed) ? parsed : 0,
                  });
                }}
              />
            )}
          </FormField>

          <label className="admin-checkbox-label">
            <input
              type="checkbox"
              checked={image.isPrimary}
              onChange={(e) => onUpdate({ isPrimary: e.target.checked })}
            />
            <span>{ADMIN_CATALOG_COPY.MEDIA.PRIMARY_LABEL}</span>
          </label>

          <label className="admin-checkbox-label">
            <input
              type="checkbox"
              checked={image.isApproved}
              onChange={(e) => onUpdate({ isApproved: e.target.checked })}
            />
            <span>{ADMIN_CATALOG_COPY.MEDIA.PROMOTE_LABEL}</span>
          </label>
        </div>
      </div>
    </Card>
  );
}
