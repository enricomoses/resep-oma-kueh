'use client';

import { Upload } from 'lucide-react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';

interface AdminPromotionBannerFieldProps {
  bannerPreviewUrl: string | null;
  bannerImagePath: string | null;
  isUploading: boolean;
  uploadError: string | null;
  onFileChange: (file: File | null) => void;
  onRemoveBanner: () => void;
}

/** Upload trigger, clear action, error hint, and live thumbnail for optional promotion banners. */
export function AdminPromotionBannerField({
  bannerPreviewUrl,
  bannerImagePath,
  isUploading,
  uploadError,
  onFileChange,
  onRemoveBanner,
}: AdminPromotionBannerFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor="promo-banner-upload" className="ui-field-label block">
        Banner Promosi (Opsional)
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--border-sand)] bg-white px-3 py-1.5 text-xs font-medium">
          <Upload size={14} aria-hidden="true" />
          {isUploading ? 'Mengunggah...' : 'Unggah Banner'}
          <input
            id="promo-banner-upload"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            disabled={isUploading}
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          />
        </label>
        {bannerPreviewUrl || bannerImagePath ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemoveBanner}
          >
            Hapus Banner
          </Button>
        ) : null}
      </div>
      {uploadError ? (
        <p className="text-xs text-danger">{uploadError}</p>
      ) : null}
      {bannerPreviewUrl ? (
        <div className="relative h-24 w-48 overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border-sand)]">
          <Image
            src={bannerPreviewUrl}
            alt="Pratinjau banner promosi"
            fill
            sizes="192px"
            unoptimized
            className="object-cover"
          />
        </div>
      ) : null}
    </div>
  );
}
