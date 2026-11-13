import 'server-only';

import type { ZodError } from 'zod';

import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import {
  CONTENT_DEFAULTS,
  PUBLIC_CMS_KEYS,
} from '@/constants/content.constant';
import { HOME_CMS_DEFAULTS } from '@/constants/home.constant';
import { AuthForbiddenError } from '@/features/auth/errors.server';
import { APPROVED_CONTACTS } from '@/features/branches/contacts.server';
import { createServerAuthClient } from '@/lib/supabase/server';
import type { AdminCmsEntry, AdminCmsListResponse } from '@/types/admin-cms';
import type { AdminSessionProfile } from '@/types/auth';
import type { PublicCmsKey } from '@/types/content';
import type { Json } from '@/types/database';
import {
  ADMIN_MEDIA_BUCKETS,
  isSafeStoragePathForBucket,
} from '@/utils/admin-media';
import {
  adminCmsEntrySchema,
  adminCmsListResponseSchema,
  saveAdminCmsInputSchema,
} from '@/validations/admin-cms.schema';
import {
  cmsPayloadSchemasByKey,
  publicCmsKeySchema,
} from '@/validations/content.schema';

import {
  AdminCatalogConflictError,
  AdminCatalogNotFoundError,
  AdminCatalogUpstreamError,
  AdminCatalogValidationError,
  mapPostgresCmsError,
} from './errors.server';
import {
  cleanupOrphanStorageObjects,
  promoteDraftMediaToPublicBucket,
  resolveAdminMediaPreviewUrl,
} from './media.server';
import type { AdminRepoContext } from './repository.server';

const SITE_CONTENT_SELECT = 'key,content_json,status,created_at,updated_at';

function assertOwner(profile: AdminSessionProfile): void {
  if (profile.role !== 'owner') {
    throw new AuthForbiddenError(ADMIN_CATALOG_COPY.CMS.ERRORS.OWNER_ONLY);
  }
}

function getDefaultTemplatePayload(key: PublicCmsKey): Record<string, unknown> {
  switch (key) {
    case 'business.contacts':
      return {
        email: APPROVED_CONTACTS.email,
        instagram_url: APPROVED_CONTACTS.instagramUrl,
      };
    case 'home.hero':
      return {
        headline: HOME_CMS_DEFAULTS.HERO.headline,
        subcopy: HOME_CMS_DEFAULTS.HERO.subcopy,
        image_alt: HOME_CMS_DEFAULTS.HERO.imageAlt,
      };
    case 'home.story':
      return {
        title: HOME_CMS_DEFAULTS.STORY.title,
        body: HOME_CMS_DEFAULTS.STORY.body,
        image_alt: HOME_CMS_DEFAULTS.STORY.imageAlt,
      };
    case 'home.class_promo':
      return {
        title: HOME_CMS_DEFAULTS.CLASS_PROMO.title,
        body: HOME_CMS_DEFAULTS.CLASS_PROMO.body,
      };
    case 'home.custom_business':
      return {
        title: CONTENT_DEFAULTS.CUSTOM_BUSINESS.title,
        body: CONTENT_DEFAULTS.CUSTOM_BUSINESS.body,
      };
    case 'about.story':
      return {
        title: CONTENT_DEFAULTS.ABOUT_STORY.title,
        body: CONTENT_DEFAULTS.ABOUT_STORY.body,
      };
    case 'about.values':
      return {
        items: [...CONTENT_DEFAULTS.ABOUT_VALUES],
      };
    case 'footer.note':
      return {
        text: CONTENT_DEFAULTS.FOOTER_NOTE.text,
      };
    case 'legal.privacy':
      return {
        title: CONTENT_DEFAULTS.LEGAL_PRIVACY.title,
        body: CONTENT_DEFAULTS.LEGAL_PRIVACY.body,
      };
    case 'legal.ordering_policy':
      return {
        title: CONTENT_DEFAULTS.LEGAL_ORDERING_POLICY.title,
        body: CONTENT_DEFAULTS.LEGAL_ORDERING_POLICY.body,
      };
    case 'community.instagram':
      return {
        url: APPROVED_CONTACTS.instagramUrl,
        items: [],
      };
    case 'promo.shipping_banner':
      return {
        title: 'Informasi Pengiriman',
        body: 'Ongkos kirim dikonfirmasi manual oleh admin cabang melalui WhatsApp sebelum pembayaran.',
      };
  }
}

function buildReleaseWarnings(key: PublicCmsKey): string[] {
  const warnings: string[] = [];
  if (key === 'business.contacts') {
    warnings.push(ADMIN_CATALOG_COPY.CMS.CONTACTS_SOURCE_NOTE);
  }
  if (key === 'about.story' || key === 'home.story') {
    warnings.push(ADMIN_CATALOG_COPY.CMS.NO_NATURAL_UNIVERSAL_NOTE);
  }
  if (key === 'legal.privacy' || key === 'legal.ordering_policy') {
    warnings.push(ADMIN_CATALOG_COPY.CMS.OWNER_SIGNOFF_GATE);
  }
  return warnings;
}

function formatZodFieldErrors(error: ZodError): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join('.') : 'root';
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(issue.message);
  }
  return result;
}

function collectMediaPathsFromPayload(
  key: PublicCmsKey,
  payload: Record<string, unknown>,
): string[] {
  const paths: string[] = [];
  if (typeof payload.image_path === 'string' && payload.image_path.length > 0) {
    paths.push(payload.image_path);
  }
  if (key === 'community.instagram' && Array.isArray(payload.items)) {
    for (const item of payload.items) {
      if (
        item &&
        typeof item === 'object' &&
        !Array.isArray(item) &&
        typeof (item as Record<string, unknown>).image_path === 'string'
      ) {
        paths.push((item as Record<string, unknown>).image_path as string);
      }
    }
  }
  return [...new Set(paths)];
}

async function resolvePreviewImageUrls(
  key: PublicCmsKey,
  payload: Record<string, unknown>,
  ctx: AdminRepoContext,
): Promise<Record<string, string>> {
  const paths = collectMediaPathsFromPayload(key, payload);
  const resolved: Record<string, string> = {};
  await Promise.all(
    paths.map(async (storagePath) => {
      const bucket = isSafeStoragePathForBucket(
        ADMIN_MEDIA_BUCKETS.BRAND_ASSETS,
        storagePath,
      )
        ? ADMIN_MEDIA_BUCKETS.BRAND_ASSETS
        : ADMIN_MEDIA_BUCKETS.DRAFTS;
      const url = await resolveAdminMediaPreviewUrl(bucket, storagePath, ctx);
      if (url) {
        resolved[storagePath] = url;
      }
    }),
  );
  return resolved;
}

async function readOwnerContentAuditUser(
  key: PublicCmsKey,
  ctx: AdminRepoContext,
): Promise<string | null> {
  const client = await createServerAuthClient(ctx.response);
  const { data, error } = await client.rpc('read_owner_content_audit', {
    content_key: key,
  });
  if (error || !Array.isArray(data) || data.length === 0) {
    return null;
  }
  return data[0]?.updated_by ?? null;
}

function parseCmsKeyParam(rawKey: string): PublicCmsKey {
  const parsed = publicCmsKeySchema.safeParse(rawKey);
  if (!parsed.success) {
    throw new AdminCatalogValidationError(
      ADMIN_CATALOG_COPY.CMS.ERRORS.INVALID_KEY,
      { key: [ADMIN_CATALOG_COPY.CMS.ERRORS.INVALID_KEY] },
    );
  }
  return parsed.data;
}

async function mapContentRowToDto(
  key: PublicCmsKey,
  row: {
    key: string;
    content_json: unknown;
    status: string;
    created_at: string;
    updated_at: string;
  } | null,
  ctx: AdminRepoContext,
): Promise<AdminCmsEntry> {
  const rawPayload =
    row &&
    row.content_json &&
    typeof row.content_json === 'object' &&
    !Array.isArray(row.content_json)
      ? (row.content_json as Record<string, unknown>)
      : getDefaultTemplatePayload(key);

  const schema = cmsPayloadSchemasByKey[key];
  const parsedContent = schema.safeParse(rawPayload);
  const contentPayload = parsedContent.success
    ? (parsedContent.data as Record<string, unknown>)
    : getDefaultTemplatePayload(key);

  const [previewImageUrls, updatedBy] = await Promise.all([
    resolvePreviewImageUrls(key, contentPayload, ctx),
    row ? readOwnerContentAuditUser(key, ctx) : Promise.resolve(null),
  ]);

  return adminCmsEntrySchema.parse({
    key,
    status: row?.status === 'published' ? 'published' : 'draft',
    content: contentPayload,
    previewImageUrls,
    updatedBy,
    createdAt: row?.created_at ?? null,
    updatedAt: row?.updated_at ?? null,
    isPersisted: Boolean(row),
    releaseWarnings: buildReleaseWarnings(key),
  });
}

export async function listAdminCmsEntries(
  profile: AdminSessionProfile,
  ctx: AdminRepoContext = {},
): Promise<AdminCmsListResponse> {
  assertOwner(profile);
  const client = await createServerAuthClient(ctx.response);
  const query = client
    .from('site_content')
    .select(SITE_CONTENT_SELECT)
    .in('key', [...PUBLIC_CMS_KEYS])
    .order('key');
  if (ctx.signal) {
    query.abortSignal(ctx.signal);
  }

  const { data, error } = await query;
  if (error) {
    throw new AdminCatalogUpstreamError();
  }

  const byKey = new Map((data ?? []).map((row) => [row.key, row]));
  const items = await Promise.all(
    PUBLIC_CMS_KEYS.map((key) =>
      mapContentRowToDto(key, byKey.get(key) ?? null, ctx),
    ),
  );

  return adminCmsListResponseSchema.parse({ items });
}

export async function readAdminCmsEntry(
  profile: AdminSessionProfile,
  rawKey: string,
  ctx: AdminRepoContext = {},
): Promise<AdminCmsEntry> {
  assertOwner(profile);
  const key = parseCmsKeyParam(rawKey);
  const client = await createServerAuthClient(ctx.response);
  const query = client
    .from('site_content')
    .select(SITE_CONTENT_SELECT)
    .eq('key', key);
  if (ctx.signal) {
    query.abortSignal(ctx.signal);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    throw new AdminCatalogUpstreamError();
  }

  return mapContentRowToDto(key, data, ctx);
}

function assertPublishPrerequisites(
  key: PublicCmsKey,
  status: 'draft' | 'published',
  payload: Record<string, unknown>,
): void {
  if (status !== 'published') {
    return;
  }
  if (key === 'home.hero') {
    const path = payload.image_path;
    const alt = payload.image_alt;
    const approved = payload.media_approved;
    if (
      typeof path !== 'string' ||
      !isSafeStoragePathForBucket(ADMIN_MEDIA_BUCKETS.BRAND_ASSETS, path) ||
      typeof alt !== 'string' ||
      alt.trim().length === 0 ||
      approved !== true
    ) {
      throw new AdminCatalogValidationError(
        ADMIN_CATALOG_COPY.CMS.ERRORS.MEDIA_REQUIRED,
        { image_path: [ADMIN_CATALOG_COPY.CMS.ERRORS.MEDIA_REQUIRED] },
      );
    }
  }
  if (
    (key === 'home.story' ||
      key === 'home.class_promo' ||
      key === 'home.custom_business' ||
      key === 'about.story') &&
    typeof payload.image_path === 'string' &&
    payload.image_path.length > 0
  ) {
    const path = payload.image_path;
    const alt = payload.image_alt;
    const approved = payload.media_approved;
    if (
      !isSafeStoragePathForBucket(ADMIN_MEDIA_BUCKETS.BRAND_ASSETS, path) ||
      typeof alt !== 'string' ||
      alt.trim().length === 0 ||
      approved !== true
    ) {
      throw new AdminCatalogValidationError(
        ADMIN_CATALOG_COPY.CMS.ERRORS.MEDIA_REQUIRED,
        { image_path: [ADMIN_CATALOG_COPY.CMS.ERRORS.MEDIA_REQUIRED] },
      );
    }
  }
  if (key === 'community.instagram') {
    const items = Array.isArray(payload.items) ? payload.items : [];
    if (items.length === 0) {
      throw new AdminCatalogValidationError(
        'Publikasi Community Instagram membutuhkan minimal 1 kartu terkurasi yang disetujui.',
        {
          items: [
            'Publikasi Community Instagram membutuhkan minimal 1 kartu terkurasi yang disetujui.',
          ],
        },
      );
    }
  }
}

async function resolveAndPromoteMediaPath(
  profile: AdminSessionProfile,
  rawPath: string,
  fieldKey: string,
  ctx: AdminRepoContext,
  promotedTargets: { storageBucket: string; storagePath: string }[],
): Promise<string> {
  if (isSafeStoragePathForBucket(ADMIN_MEDIA_BUCKETS.BRAND_ASSETS, rawPath)) {
    return rawPath;
  }
  if (isSafeStoragePathForBucket(ADMIN_MEDIA_BUCKETS.DRAFTS, rawPath)) {
    const promoted = await promoteDraftMediaToPublicBucket(
      profile,
      rawPath,
      ctx,
      ADMIN_MEDIA_BUCKETS.BRAND_ASSETS,
    );
    promotedTargets.push(promoted);
    return promoted.storagePath;
  }
  throw new AdminCatalogValidationError(
    ADMIN_CATALOG_COPY.MEDIA.ERRORS.INVALID_STORAGE_PATH,
    { [fieldKey]: [ADMIN_CATALOG_COPY.MEDIA.ERRORS.INVALID_STORAGE_PATH] },
  );
}

export async function saveAdminCmsEntry(
  profile: AdminSessionProfile,
  rawKey: string,
  rawBody: unknown,
  ctx: AdminRepoContext = {},
): Promise<AdminCmsEntry> {
  assertOwner(profile);
  const key = parseCmsKeyParam(rawKey);
  const parsedOuter = saveAdminCmsInputSchema.safeParse(rawBody);
  if (!parsedOuter.success) {
    throw new AdminCatalogValidationError(
      ADMIN_CATALOG_COPY.CMS.ERRORS.UNSAFE_TEXT,
      formatZodFieldErrors(parsedOuter.error),
    );
  }

  const schema = cmsPayloadSchemasByKey[key];
  const parsedContent = schema.safeParse(parsedOuter.data.content);
  if (!parsedContent.success) {
    throw new AdminCatalogValidationError(
      ADMIN_CATALOG_COPY.CMS.ERRORS.UNSAFE_TEXT,
      formatZodFieldErrors(parsedContent.error),
    );
  }

  const client = await createServerAuthClient(ctx.response);
  const existingQuery = client
    .from('site_content')
    .select(SITE_CONTENT_SELECT)
    .eq('key', key);
  if (ctx.signal) {
    existingQuery.abortSignal(ctx.signal);
  }
  const { data: existing, error: readErr } = await existingQuery.maybeSingle();
  if (readErr) {
    throw new AdminCatalogUpstreamError();
  }

  const expectedUpdatedAt = parsedOuter.data.expectedUpdatedAt;
  if (existing && expectedUpdatedAt !== existing.updated_at) {
    throw new AdminCatalogConflictError(
      ADMIN_CATALOG_COPY.CMS.ERRORS.STALE_CONFLICT,
    );
  }
  if (!existing && expectedUpdatedAt !== null) {
    throw new AdminCatalogConflictError(
      ADMIN_CATALOG_COPY.CMS.ERRORS.STALE_CONFLICT,
    );
  }

  const normalizedPayload = {
    ...(parsedContent.data as Record<string, unknown>),
  };
  const promotedTargets: { storageBucket: string; storagePath: string }[] = [];
  const oldPaths = existing
    ? collectMediaPathsFromPayload(
        key,
        (existing.content_json as Record<string, unknown>) ?? {},
      )
    : [];

  try {
    if (
      typeof normalizedPayload.image_path === 'string' &&
      normalizedPayload.image_path.length > 0
    ) {
      normalizedPayload.image_path = await resolveAndPromoteMediaPath(
        profile,
        normalizedPayload.image_path,
        'image_path',
        ctx,
        promotedTargets,
      );
      if (parsedOuter.data.status === 'published') {
        normalizedPayload.media_approved = true;
      }
    }

    if (
      key === 'community.instagram' &&
      Array.isArray(normalizedPayload.items)
    ) {
      const nextItems = [];
      for (let i = 0; i < normalizedPayload.items.length; i += 1) {
        const entry = normalizedPayload.items[i] as Record<string, unknown>;
        const nextPath = await resolveAndPromoteMediaPath(
          profile,
          String(entry.image_path ?? ''),
          `items.${i}.image_path`,
          ctx,
          promotedTargets,
        );
        nextItems.push({
          ...entry,
          image_path: nextPath,
        });
      }
      normalizedPayload.items = nextItems;
    }

    assertPublishPrerequisites(key, parsedOuter.data.status, normalizedPayload);

    const payloadJson = normalizedPayload as Exclude<Json, null>;

    let savedRow: {
      key: string;
      content_json: unknown;
      status: string;
      created_at: string;
      updated_at: string;
    } | null = null;

    if (existing) {
      const updateQuery = client
        .from('site_content')
        .update({
          content_json: payloadJson,
          status: parsedOuter.data.status,
          updated_by: profile.userId,
        })
        .eq('key', key)
        .eq('updated_at', expectedUpdatedAt!)
        .select(SITE_CONTENT_SELECT);
      if (ctx.signal) {
        updateQuery.abortSignal(ctx.signal);
      }
      const { data, error } = await updateQuery.maybeSingle();
      if (error) {
        mapPostgresCmsError(error, 'content');
      }
      if (!data) {
        throw new AdminCatalogConflictError(
          ADMIN_CATALOG_COPY.CMS.ERRORS.STALE_CONFLICT,
        );
      }
      savedRow = data;
    } else {
      const insertQuery = client
        .from('site_content')
        .insert({
          key,
          content_json: payloadJson,
          status: parsedOuter.data.status,
          updated_by: profile.userId,
        })
        .select(SITE_CONTENT_SELECT);
      if (ctx.signal) {
        insertQuery.abortSignal(ctx.signal);
      }
      const { data, error } = await insertQuery.maybeSingle();
      if (error) {
        if (error.code === '23505') {
          throw new AdminCatalogConflictError(
            ADMIN_CATALOG_COPY.CMS.ERRORS.STALE_CONFLICT,
          );
        }
        mapPostgresCmsError(error, 'content');
      }
      if (!data) {
        throw new AdminCatalogNotFoundError();
      }
      savedRow = data;
    }

    const newPathSet = new Set(
      collectMediaPathsFromPayload(key, normalizedPayload),
    );
    const removedApproved = oldPaths
      .filter(
        (oldPath) =>
          !newPathSet.has(oldPath) &&
          isSafeStoragePathForBucket(ADMIN_MEDIA_BUCKETS.BRAND_ASSETS, oldPath),
      )
      .map((storagePath) => ({
        storageBucket: ADMIN_MEDIA_BUCKETS.BRAND_ASSETS,
        storagePath,
      }));
    if (removedApproved.length > 0) {
      await cleanupOrphanStorageObjects(
        profile,
        removedApproved,
        'removed_from_content',
        ctx,
      );
    }

    return mapContentRowToDto(key, savedRow, ctx);
  } catch (err) {
    if (promotedTargets.length > 0) {
      await cleanupOrphanStorageObjects(
        profile,
        promotedTargets,
        'content_save_rollback',
        ctx,
      );
    }
    throw err;
  }
}
