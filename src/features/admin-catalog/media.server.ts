import 'server-only';

import sharp, { type Metadata as SharpMetadata } from 'sharp';

import {
  ADMIN_CATALOG_COPY,
  ADMIN_MEDIA_LIMITS,
} from '@/constants/admin-catalog.constant';
import {
  AuthForbiddenError,
  AuthRequestTooLargeError,
} from '@/features/auth/errors.server';
import { createServerAuthClient } from '@/lib/supabase/server';
import type { AdminMediaUploadResponse } from '@/types/admin-catalog';
import type { AdminSessionProfile } from '@/types/auth';
import {
  ADMIN_MEDIA_ALLOWED_MIME_TYPES,
  ADMIN_MEDIA_BUCKETS,
  type DetectedImageFormat,
  detectImageFormatFromMagicBytes,
  isSafeStoragePathForBucket,
  sanitizeOriginalFileName,
} from '@/utils/admin-media';

import {
  AdminCatalogUpstreamError,
  AdminCatalogValidationError,
} from './errors.server';
import type { AdminRepoContext } from './repository.server';

type AllowedMimeType = (typeof ADMIN_MEDIA_ALLOWED_MIME_TYPES)[number];

interface ReencodedImageResult {
  buffer: Buffer;
  mimeType: AllowedMimeType;
  extension: 'jpg' | 'png' | 'webp' | 'avif';
  width: number;
  height: number;
}

function assertOwnerForMedia(profile: AdminSessionProfile): void {
  if (profile.role !== 'owner') {
    throw new AuthForbiddenError();
  }
}

function formatToMimeAndExt(format: 'jpeg' | 'png' | 'webp' | 'avif'): {
  mimeType: AllowedMimeType;
  extension: 'jpg' | 'png' | 'webp' | 'avif';
} {
  switch (format) {
    case 'jpeg':
      return { mimeType: 'image/jpeg', extension: 'jpg' };
    case 'png':
      return { mimeType: 'image/png', extension: 'png' };
    case 'webp':
      return { mimeType: 'image/webp', extension: 'webp' };
    case 'avif':
      return { mimeType: 'image/avif', extension: 'avif' };
  }
}

function matchesDecodedSharpFormat(
  magicFormat: DetectedImageFormat,
  sharpFormat: string | undefined,
): sharpFormat is string {
  if (!sharpFormat) return false;
  if (magicFormat === 'jpeg') return sharpFormat === 'jpeg';
  if (magicFormat === 'png') return sharpFormat === 'png';
  if (magicFormat === 'webp') return sharpFormat === 'webp';
  if (magicFormat === 'avif') {
    return sharpFormat === 'avif' || sharpFormat === 'heif';
  }
  return false;
}

/**
 * Decodes, validates magic bytes + dimensions, rejects SVG/animated/oversize files,
 * and re-encodes via sharp without keeping EXIF/IPTC/XMP metadata.
 */
async function validateAndReencodeImage(
  rawBytes: Uint8Array,
  declaredMimeType?: string,
): Promise<ReencodedImageResult> {
  if (rawBytes.byteLength === 0) {
    throw new AdminCatalogValidationError(
      ADMIN_CATALOG_COPY.MEDIA.ERRORS.INVALID_FILE_TYPE,
      { file: [ADMIN_CATALOG_COPY.MEDIA.ERRORS.INVALID_FILE_TYPE] },
    );
  }

  if (rawBytes.byteLength > ADMIN_MEDIA_LIMITS.MAX_FILE_BYTES) {
    throw new AuthRequestTooLargeError(
      ADMIN_CATALOG_COPY.MEDIA.ERRORS.FILE_TOO_LARGE,
    );
  }

  if (
    declaredMimeType &&
    declaredMimeType !== 'application/octet-stream' &&
    !ADMIN_MEDIA_ALLOWED_MIME_TYPES.includes(
      declaredMimeType as AllowedMimeType,
    )
  ) {
    throw new AdminCatalogValidationError(
      ADMIN_CATALOG_COPY.MEDIA.ERRORS.INVALID_FILE_TYPE,
      { file: [ADMIN_CATALOG_COPY.MEDIA.ERRORS.INVALID_FILE_TYPE] },
    );
  }

  const magicFormat = detectImageFormatFromMagicBytes(rawBytes);
  if (magicFormat === 'svg' || magicFormat === 'unknown') {
    throw new AdminCatalogValidationError(
      ADMIN_CATALOG_COPY.MEDIA.ERRORS.INVALID_FILE_TYPE,
      { file: [ADMIN_CATALOG_COPY.MEDIA.ERRORS.INVALID_FILE_TYPE] },
    );
  }

  let metadata: SharpMetadata;
  try {
    metadata = await sharp(rawBytes, {
      limitInputPixels: ADMIN_MEDIA_LIMITS.MAX_INPUT_PIXELS,
      failOn: 'error',
    }).metadata();
  } catch {
    throw new AdminCatalogValidationError(
      ADMIN_CATALOG_COPY.MEDIA.ERRORS.DIMENSIONS_EXCEEDED,
      { file: [ADMIN_CATALOG_COPY.MEDIA.ERRORS.DIMENSIONS_EXCEEDED] },
    );
  }

  if (
    !matchesDecodedSharpFormat(magicFormat, metadata.format) ||
    (metadata.pages !== undefined && metadata.pages > 1)
  ) {
    throw new AdminCatalogValidationError(
      ADMIN_CATALOG_COPY.MEDIA.ERRORS.INVALID_FILE_TYPE,
      { file: [ADMIN_CATALOG_COPY.MEDIA.ERRORS.INVALID_FILE_TYPE] },
    );
  }

  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  if (
    width <= 0 ||
    height <= 0 ||
    width > ADMIN_MEDIA_LIMITS.MAX_DIMENSION_PX ||
    height > ADMIN_MEDIA_LIMITS.MAX_DIMENSION_PX
  ) {
    throw new AdminCatalogValidationError(
      ADMIN_CATALOG_COPY.MEDIA.ERRORS.DIMENSIONS_EXCEEDED,
      { file: [ADMIN_CATALOG_COPY.MEDIA.ERRORS.DIMENSIONS_EXCEEDED] },
    );
  }

  const pipeline = sharp(rawBytes, {
    limitInputPixels: ADMIN_MEDIA_LIMITS.MAX_INPUT_PIXELS,
    failOn: 'error',
  }).rotate();

  let encoded: Buffer;
  try {
    switch (magicFormat) {
      case 'jpeg':
        encoded = await pipeline
          .jpeg({ quality: 88, mozjpeg: true })
          .toBuffer();
        break;
      case 'png':
        encoded = await pipeline.png({ compressionLevel: 9 }).toBuffer();
        break;
      case 'webp':
        encoded = await pipeline.webp({ quality: 86 }).toBuffer();
        break;
      case 'avif':
        encoded = await pipeline.avif({ quality: 65 }).toBuffer();
        break;
    }
  } catch {
    throw new AdminCatalogValidationError(
      ADMIN_CATALOG_COPY.MEDIA.ERRORS.DIMENSIONS_EXCEEDED,
      { file: [ADMIN_CATALOG_COPY.MEDIA.ERRORS.DIMENSIONS_EXCEEDED] },
    );
  }

  if (encoded.byteLength > ADMIN_MEDIA_LIMITS.MAX_FILE_BYTES) {
    throw new AuthRequestTooLargeError(
      ADMIN_CATALOG_COPY.MEDIA.ERRORS.FILE_TOO_LARGE,
    );
  }

  const normalized = formatToMimeAndExt(magicFormat);
  const outMeta = await sharp(encoded).metadata();

  return {
    buffer: encoded,
    mimeType: normalized.mimeType,
    extension: normalized.extension,
    width: outMeta.width ?? width,
    height: outMeta.height ?? height,
  };
}

/**
 * Validates and uploads an image into owner-private bucket `media-drafts`,
 * returning a short-lived signed preview URL and random UUID object path.
 */
export async function uploadDraftProductMedia(
  profile: AdminSessionProfile,
  fileInput: {
    bytes: Uint8Array;
    mimeType?: string;
    originalFileName?: string;
  },
  ctx: AdminRepoContext = {},
): Promise<AdminMediaUploadResponse> {
  assertOwnerForMedia(profile);

  const safeDisplayName = sanitizeOriginalFileName(
    fileInput.originalFileName ?? 'upload',
  );
  const processed = await validateAndReencodeImage(
    fileInput.bytes,
    fileInput.mimeType,
  );

  const objectId = crypto.randomUUID().toLowerCase();
  const storagePath = `${profile.userId}/drafts/${objectId}.${processed.extension}`;
  if (!isSafeStoragePathForBucket(ADMIN_MEDIA_BUCKETS.DRAFTS, storagePath)) {
    throw new AdminCatalogValidationError(
      ADMIN_CATALOG_COPY.MEDIA.ERRORS.INVALID_STORAGE_PATH,
    );
  }

  const client = await createServerAuthClient(ctx.response);
  const { error: uploadError } = await client.storage
    .from(ADMIN_MEDIA_BUCKETS.DRAFTS)
    .upload(storagePath, processed.buffer, {
      contentType: processed.mimeType,
      upsert: false,
    });

  if (uploadError) {
    throw new AdminCatalogUpstreamError();
  }

  const { data: signedData, error: signError } = await client.storage
    .from(ADMIN_MEDIA_BUCKETS.DRAFTS)
    .createSignedUrl(
      storagePath,
      ADMIN_MEDIA_LIMITS.SIGNED_PREVIEW_TTL_SECONDS,
    );

  if (signError || !signedData?.signedUrl) {
    await client.storage
      .from(ADMIN_MEDIA_BUCKETS.DRAFTS)
      .remove([storagePath])
      .catch(() => undefined);
    throw new AdminCatalogUpstreamError();
  }

  return {
    storageBucket: ADMIN_MEDIA_BUCKETS.DRAFTS,
    storagePath,
    previewUrl: signedData.signedUrl,
    mimeType: processed.mimeType,
    byteSize: processed.buffer.byteLength,
    width: processed.width,
    height: processed.height,
    originalFileName: safeDisplayName,
  };
}

/**
 * Copies & re-encodes a verified draft object into public bucket `product-images`
 * under random UUID path `approved/<uuid>.<ext>` using owner SSR session.
 */
export async function promoteDraftMediaToPublicBucket<
  TBucket extends
    | typeof ADMIN_MEDIA_BUCKETS.PRODUCT_IMAGES
    | typeof ADMIN_MEDIA_BUCKETS.BRAND_ASSETS =
    typeof ADMIN_MEDIA_BUCKETS.PRODUCT_IMAGES,
>(
  profile: AdminSessionProfile,
  draftStoragePath: string,
  ctx: AdminRepoContext = {},
  targetBucket: TBucket = ADMIN_MEDIA_BUCKETS.PRODUCT_IMAGES as TBucket,
): Promise<{
  storageBucket: TBucket;
  storagePath: string;
}> {
  assertOwnerForMedia(profile);

  if (
    !isSafeStoragePathForBucket(ADMIN_MEDIA_BUCKETS.DRAFTS, draftStoragePath)
  ) {
    throw new AdminCatalogValidationError(
      ADMIN_CATALOG_COPY.MEDIA.ERRORS.INVALID_STORAGE_PATH,
      { images: [ADMIN_CATALOG_COPY.MEDIA.ERRORS.INVALID_STORAGE_PATH] },
    );
  }

  const client = await createServerAuthClient(ctx.response);
  const { data: downloadedBlob, error: downloadError } = await client.storage
    .from(ADMIN_MEDIA_BUCKETS.DRAFTS)
    .download(draftStoragePath);

  if (downloadError || !downloadedBlob) {
    throw new AdminCatalogValidationError(
      ADMIN_CATALOG_COPY.PRODUCT_EDITOR.ERRORS.IMAGE_STORAGE_INVALID,
      {
        images: [
          ADMIN_CATALOG_COPY.PRODUCT_EDITOR.ERRORS.IMAGE_STORAGE_INVALID,
        ],
      },
    );
  }

  const rawBytes = new Uint8Array(await downloadedBlob.arrayBuffer());
  const reencoded = await validateAndReencodeImage(rawBytes);

  const approvedPath = `approved/${crypto.randomUUID().toLowerCase()}.${reencoded.extension}`;
  const { error: uploadError } = await client.storage
    .from(targetBucket)
    .upload(approvedPath, reencoded.buffer, {
      contentType: reencoded.mimeType,
      upsert: false,
    });

  if (uploadError) {
    throw new AdminCatalogUpstreamError();
  }

  return {
    storageBucket: targetBucket,
    storagePath: approvedPath,
  };
}

export async function resolveAdminMediaPreviewUrl(
  storageBucket: string,
  storagePath: string,
  ctx: AdminRepoContext = {},
): Promise<string | null> {
  if (!isSafeStoragePathForBucket(storageBucket, storagePath)) {
    return null;
  }

  const client = await createServerAuthClient(ctx.response);
  if (
    storageBucket === ADMIN_MEDIA_BUCKETS.PRODUCT_IMAGES ||
    storageBucket === ADMIN_MEDIA_BUCKETS.BRAND_ASSETS
  ) {
    const { data } = client.storage
      .from(storageBucket)
      .getPublicUrl(storagePath);
    return data.publicUrl ?? null;
  }

  if (storageBucket === ADMIN_MEDIA_BUCKETS.DRAFTS) {
    const { data, error } = await client.storage
      .from(ADMIN_MEDIA_BUCKETS.DRAFTS)
      .createSignedUrl(
        storagePath,
        ADMIN_MEDIA_LIMITS.SIGNED_PREVIEW_TTL_SECONDS,
      );
    if (error || !data?.signedUrl) {
      return null;
    }
    return data.signedUrl;
  }

  return null;
}

function siteContentReferencesImagePath(
  contentJson: unknown,
  storagePath: string,
): boolean {
  if (
    !contentJson ||
    typeof contentJson !== 'object' ||
    Array.isArray(contentJson)
  ) {
    return false;
  }
  const obj = contentJson as Record<string, unknown>;
  if (obj.image_path === storagePath) {
    return true;
  }
  if (Array.isArray(obj.items)) {
    return obj.items.some(
      (item) =>
        Boolean(item) &&
        typeof item === 'object' &&
        !Array.isArray(item) &&
        (item as Record<string, unknown>).image_path === storagePath,
    );
  }
  return false;
}

/**
 * Controlled single-object orphan cleanup after failed config transaction or unreferenced removal.
 * Checks product_images, promotions, and site_content references before deleting so shared/referenced assets are never deleted.
 */
export async function cleanupOrphanStorageObjects(
  profile: AdminSessionProfile,
  targets: ReadonlyArray<{ storageBucket: string; storagePath: string }>,
  reason:
    | 'config_save_rollback'
    | 'removed_from_product'
    | 'removed_from_promotion'
    | 'content_save_rollback'
    | 'removed_from_content',
  ctx: AdminRepoContext = {},
): Promise<{ deletedCount: number; skippedReferencedCount: number }> {
  assertOwnerForMedia(profile);

  if (targets.length === 0) {
    return { deletedCount: 0, skippedReferencedCount: 0 };
  }

  const client = await createServerAuthClient(ctx.response);
  let deletedCount = 0;
  let skippedReferencedCount = 0;

  let cachedContentRows: { content_json: unknown }[] | null = null;
  let contentLoadError = false;
  if (
    targets.some(
      (target) => target.storageBucket === ADMIN_MEDIA_BUCKETS.BRAND_ASSETS,
    )
  ) {
    const { data, error } = await client
      .from('site_content')
      .select('key,content_json');
    if (error) {
      contentLoadError = true;
    } else {
      cachedContentRows = data ?? [];
    }
  }

  for (const target of targets) {
    if (!isSafeStoragePathForBucket(target.storageBucket, target.storagePath)) {
      continue;
    }

    if (target.storageBucket === ADMIN_MEDIA_BUCKETS.BRAND_ASSETS) {
      const isReferencedInContent =
        contentLoadError ||
        (cachedContentRows ?? []).some((row) =>
          siteContentReferencesImagePath(row.content_json, target.storagePath),
        );
      if (isReferencedInContent) {
        skippedReferencedCount += 1;
        continue;
      }
    } else {
      const { count, error: refError } = await client
        .from('product_images')
        .select('id', { count: 'exact', head: true })
        .eq('storage_bucket', target.storageBucket)
        .eq('storage_path', target.storagePath);

      let promoCount = 0;
      let promoRefError = false;
      if (target.storageBucket === ADMIN_MEDIA_BUCKETS.PRODUCT_IMAGES) {
        const promoRef = await client
          .from('promotions')
          .select('id', { count: 'exact', head: true })
          .eq('banner_image_path', target.storagePath);
        promoCount = promoRef.count ?? 0;
        promoRefError = Boolean(promoRef.error);
      }

      if (refError || promoRefError || (count ?? 0) > 0 || promoCount > 0) {
        skippedReferencedCount += 1;
        continue;
      }
    }

    const { error: removeError } = await client.storage
      .from(target.storageBucket)
      .remove([target.storagePath]);

    if (!removeError) {
      deletedCount += 1;
    }
  }

  if (deletedCount > 0 || skippedReferencedCount > 0) {
    console.warn('[admin-media-orphan-cleanup]', {
      reason,
      deletedCount,
      skippedReferencedCount,
    });
  }

  return { deletedCount, skippedReferencedCount };
}
