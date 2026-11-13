export const ADMIN_MEDIA_BUCKETS = {
  DRAFTS: 'media-drafts',
  PRODUCT_IMAGES: 'product-images',
  BRAND_ASSETS: 'brand-assets',
  CLASS_IMAGES: 'class-images',
} as const;

export const ADMIN_MEDIA_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const;

export type DetectedImageFormat =
  'jpeg' | 'png' | 'webp' | 'avif' | 'svg' | 'unknown';

const SAFE_DRAFT_PATH_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/drafts\/[0-9a-f-]{36}\.(jpg|jpeg|png|webp|avif)$/;

const SAFE_APPROVED_PATH_REGEX =
  /^approved\/[0-9a-f-]{36}\.(jpg|jpeg|png|webp|avif)$/;

export function isSafeStoragePathForBucket(
  bucket: string,
  storagePath: string,
): boolean {
  if (
    !storagePath ||
    storagePath.length > 500 ||
    storagePath.startsWith('/') ||
    storagePath.includes('://') ||
    storagePath.includes('\\') ||
    storagePath.includes('..') ||
    /%2e|%2f|%5c/i.test(storagePath) ||
    /[\x00-\x1f\x7f]/.test(storagePath)
  ) {
    return false;
  }
  if (bucket === ADMIN_MEDIA_BUCKETS.DRAFTS) {
    return SAFE_DRAFT_PATH_REGEX.test(storagePath);
  }
  if (
    bucket === ADMIN_MEDIA_BUCKETS.PRODUCT_IMAGES ||
    bucket === ADMIN_MEDIA_BUCKETS.BRAND_ASSETS ||
    bucket === ADMIN_MEDIA_BUCKETS.CLASS_IMAGES
  ) {
    return SAFE_APPROVED_PATH_REGEX.test(storagePath);
  }
  return false;
}

export function sanitizeOriginalFileName(rawName: string): string {
  const leaf = rawName.split(/[\\/]/).pop() ?? 'upload';
  const cleaned = leaf
    .replace(/[\x00-\x1f\x7f<>:"|?*]/g, '')
    .trim()
    .slice(0, 120);
  return cleaned || 'upload';
}

export function detectImageFormatFromMagicBytes(
  bytes: Uint8Array,
): DetectedImageFormat {
  if (bytes.length >= 12) {
    // JPEG: FF D8 FF
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return 'jpeg';
    }
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    ) {
      return 'png';
    }
    // WebP: RIFF....WEBP
    if (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    ) {
      return 'webp';
    }
    // ISO BMFF (AVIF): offset 4..11 contains ftypavif / ftypavis
    if (
      bytes[4] === 0x66 &&
      bytes[5] === 0x74 &&
      bytes[6] === 0x79 &&
      bytes[7] === 0x70 &&
      bytes[8] === 0x61 &&
      bytes[9] === 0x76 &&
      bytes[10] === 0x69 &&
      (bytes[11] === 0x66 || bytes[11] === 0x73)
    ) {
      return 'avif';
    }
  }

  // Inspect leading text slice for SVG / XML payloads regardless of declared MIME type
  const sampleText = new TextDecoder('utf-8', { fatal: false })
    .decode(bytes.subarray(0, Math.min(bytes.length, 512)))
    .replace(/^\uFEFF/, '')
    .trimStart()
    .toLowerCase();

  if (
    sampleText.startsWith('<svg') ||
    sampleText.startsWith('<?xml') ||
    sampleText.includes('<svg')
  ) {
    return 'svg';
  }

  return 'unknown';
}

export function formatMediaBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kib = bytes / 1024;
  if (kib < 1024) return `${kib.toFixed(1)} KiB`;
  return `${(kib / 1024).toFixed(2)} MiB`;
}
