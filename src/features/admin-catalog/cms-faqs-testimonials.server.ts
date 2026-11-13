import 'server-only';

import type { ZodError } from 'zod';

import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { AuthForbiddenError } from '@/features/auth/errors.server';
import { createServerAuthClient } from '@/lib/supabase/server';
import type {
  AdminFaqItem,
  AdminFaqListResponse,
  AdminTestimonialItem,
  AdminTestimonialListResponse,
} from '@/types/admin-cms';
import type { AdminSessionProfile } from '@/types/auth';
import {
  adminFaqItemSchema,
  adminFaqListResponseSchema,
  adminTestimonialItemSchema,
  adminTestimonialListResponseSchema,
  archiveAdminCmsEntityInputSchema,
  createAdminFaqInputSchema,
  createAdminTestimonialInputSchema,
  updateAdminFaqInputSchema,
  updateAdminTestimonialInputSchema,
} from '@/validations/admin-cms.schema';

import {
  AdminCatalogConflictError,
  AdminCatalogNotFoundError,
  AdminCatalogUpstreamError,
  AdminCatalogValidationError,
  mapPostgresCmsError,
} from './errors.server';
import type { AdminRepoContext } from './repository.server';

const FAQ_SELECT =
  'id,category,question,answer,sort_order,status,created_at,updated_at';
// Private evidence columns (consent_reference, consent_at) are NEVER selected on table REST;
// only read_owner_testimonial_evidence(uuid) can expose them to an authenticated Owner.
const TESTIMONIAL_PUBLIC_TABLE_SELECT =
  'id,display_name,quote,rating,source_label,source_url,status,sort_order,created_at,updated_at';

function assertOwner(
  profile: AdminSessionProfile,
  entity: 'faq' | 'testimonial',
): void {
  if (profile.role !== 'owner') {
    throw new AuthForbiddenError(
      entity === 'faq'
        ? ADMIN_CATALOG_COPY.FAQS.ERRORS.OWNER_ONLY
        : ADMIN_CATALOG_COPY.TESTIMONIALS.ERRORS.OWNER_ONLY,
    );
  }
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

function mapFaqRowToDto(row: {
  id: string;
  category: string;
  question: string;
  answer: string;
  sort_order: number;
  status: string;
  created_at: string;
  updated_at: string;
}): AdminFaqItem {
  return adminFaqItemSchema.parse({
    id: row.id,
    category: row.category,
    question: row.question,
    answer: row.answer,
    sortOrder: row.sort_order,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export async function listAdminFaqs(
  profile: AdminSessionProfile,
  ctx: AdminRepoContext = {},
): Promise<AdminFaqListResponse> {
  assertOwner(profile, 'faq');
  const client = await createServerAuthClient(ctx.response);
  const query = client
    .from('faqs')
    .select(FAQ_SELECT)
    .order('sort_order')
    .order('created_at')
    .order('id');
  if (ctx.signal) {
    query.abortSignal(ctx.signal);
  }

  const { data, error } = await query;
  if (error) {
    throw new AdminCatalogUpstreamError();
  }

  return adminFaqListResponseSchema.parse({
    items: (data ?? []).map(mapFaqRowToDto),
  });
}

export async function createAdminFaq(
  profile: AdminSessionProfile,
  rawBody: unknown,
  ctx: AdminRepoContext = {},
): Promise<AdminFaqItem> {
  assertOwner(profile, 'faq');
  const parsed = createAdminFaqInputSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new AdminCatalogValidationError(
      ADMIN_CATALOG_COPY.CMS.ERRORS.UNSAFE_TEXT,
      formatZodFieldErrors(parsed.error),
    );
  }

  const client = await createServerAuthClient(ctx.response);
  const query = client
    .from('faqs')
    .insert({
      category: parsed.data.category,
      question: parsed.data.question,
      answer: parsed.data.answer,
      sort_order: parsed.data.sortOrder,
      status: parsed.data.status,
    })
    .select(FAQ_SELECT);
  if (ctx.signal) {
    query.abortSignal(ctx.signal);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    mapPostgresCmsError(error, 'faq');
  }
  if (!data) {
    throw new AdminCatalogUpstreamError();
  }

  return mapFaqRowToDto(data);
}

export async function updateAdminFaq(
  profile: AdminSessionProfile,
  faqId: string,
  rawBody: unknown,
  ctx: AdminRepoContext = {},
): Promise<AdminFaqItem> {
  assertOwner(profile, 'faq');
  const parsed = updateAdminFaqInputSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new AdminCatalogValidationError(
      ADMIN_CATALOG_COPY.CMS.ERRORS.UNSAFE_TEXT,
      formatZodFieldErrors(parsed.error),
    );
  }

  const client = await createServerAuthClient(ctx.response);
  const existsQuery = client
    .from('faqs')
    .select('id,updated_at')
    .eq('id', faqId);
  if (ctx.signal) {
    existsQuery.abortSignal(ctx.signal);
  }
  const { data: existing, error: readErr } = await existsQuery.maybeSingle();
  if (readErr) {
    throw new AdminCatalogUpstreamError();
  }
  if (!existing) {
    throw new AdminCatalogNotFoundError();
  }
  if (existing.updated_at !== parsed.data.expectedUpdatedAt) {
    throw new AdminCatalogConflictError(
      ADMIN_CATALOG_COPY.FAQS.ERRORS.STALE_CONFLICT,
    );
  }

  const updateQuery = client
    .from('faqs')
    .update({
      category: parsed.data.category,
      question: parsed.data.question,
      answer: parsed.data.answer,
      sort_order: parsed.data.sortOrder,
      status: parsed.data.status,
    })
    .eq('id', faqId)
    .eq('updated_at', parsed.data.expectedUpdatedAt)
    .select(FAQ_SELECT);
  if (ctx.signal) {
    updateQuery.abortSignal(ctx.signal);
  }

  const { data, error } = await updateQuery.maybeSingle();
  if (error) {
    mapPostgresCmsError(error, 'faq');
  }
  if (!data) {
    throw new AdminCatalogConflictError(
      ADMIN_CATALOG_COPY.FAQS.ERRORS.STALE_CONFLICT,
    );
  }

  return mapFaqRowToDto(data);
}

export async function archiveAdminFaq(
  profile: AdminSessionProfile,
  faqId: string,
  rawBody: unknown,
  ctx: AdminRepoContext = {},
): Promise<AdminFaqItem> {
  assertOwner(profile, 'faq');
  const parsed = archiveAdminCmsEntityInputSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new AdminCatalogValidationError(
      ADMIN_CATALOG_COPY.CMS.ERRORS.UNSAFE_TEXT,
      formatZodFieldErrors(parsed.error),
    );
  }

  const client = await createServerAuthClient(ctx.response);
  const existsQuery = client
    .from('faqs')
    .select('id,updated_at')
    .eq('id', faqId);
  if (ctx.signal) {
    existsQuery.abortSignal(ctx.signal);
  }
  const { data: existing, error: readErr } = await existsQuery.maybeSingle();
  if (readErr) {
    throw new AdminCatalogUpstreamError();
  }
  if (!existing) {
    throw new AdminCatalogNotFoundError();
  }
  if (existing.updated_at !== parsed.data.expectedUpdatedAt) {
    throw new AdminCatalogConflictError(
      ADMIN_CATALOG_COPY.FAQS.ERRORS.STALE_CONFLICT,
    );
  }

  const archiveQuery = client
    .from('faqs')
    .update({ status: 'archived' })
    .eq('id', faqId)
    .eq('updated_at', parsed.data.expectedUpdatedAt)
    .select(FAQ_SELECT);
  if (ctx.signal) {
    archiveQuery.abortSignal(ctx.signal);
  }

  const { data, error } = await archiveQuery.maybeSingle();
  if (error) {
    mapPostgresCmsError(error, 'faq');
  }
  if (!data) {
    throw new AdminCatalogConflictError(
      ADMIN_CATALOG_COPY.FAQS.ERRORS.STALE_CONFLICT,
    );
  }

  return mapFaqRowToDto(data);
}

async function readOwnerEvidenceForTestimonial(
  testimonialId: string,
  ctx: AdminRepoContext,
): Promise<{ consentReference: string | null; consentAt: string | null }> {
  const client = await createServerAuthClient(ctx.response);
  const { data, error } = await client.rpc('read_owner_testimonial_evidence', {
    testimonial_uuid: testimonialId,
  });
  if (error || !Array.isArray(data) || data.length === 0) {
    return { consentReference: null, consentAt: null };
  }
  return {
    consentReference: data[0]?.consent_reference ?? null,
    consentAt: data[0]?.consent_at ?? null,
  };
}

function mapTestimonialRowToDto(
  row: {
    id: string;
    display_name: string;
    quote: string;
    rating: number | null;
    source_label: string | null;
    source_url: string | null;
    status: string;
    sort_order: number;
    created_at: string;
    updated_at: string;
  },
  evidence: { consentReference: string | null; consentAt: string | null },
): AdminTestimonialItem {
  return adminTestimonialItemSchema.parse({
    id: row.id,
    displayName: row.display_name,
    quote: row.quote,
    rating: row.rating,
    sourceLabel: row.source_label,
    sourceUrl: row.source_url,
    consentReference: evidence.consentReference,
    consentAt: evidence.consentAt,
    status: row.status,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export async function listAdminTestimonials(
  profile: AdminSessionProfile,
  ctx: AdminRepoContext = {},
): Promise<AdminTestimonialListResponse> {
  assertOwner(profile, 'testimonial');
  const client = await createServerAuthClient(ctx.response);
  const query = client
    .from('testimonials')
    .select(TESTIMONIAL_PUBLIC_TABLE_SELECT)
    .order('sort_order')
    .order('created_at')
    .order('id');
  if (ctx.signal) {
    query.abortSignal(ctx.signal);
  }

  const { data, error } = await query;
  if (error) {
    throw new AdminCatalogUpstreamError();
  }

  const rows = data ?? [];
  const evidences = await Promise.all(
    rows.map((row) => readOwnerEvidenceForTestimonial(row.id, ctx)),
  );

  return adminTestimonialListResponseSchema.parse({
    items: rows.map((row, idx) =>
      mapTestimonialRowToDto(
        row,
        evidences[idx] ?? { consentReference: null, consentAt: null },
      ),
    ),
  });
}

function normalizeOptionalIsoTimestamp(raw: string | null): string | null {
  if (!raw || raw.trim().length === 0) {
    return null;
  }
  const date = new Date(raw.trim());
  if (Number.isNaN(date.getTime())) {
    throw new AdminCatalogValidationError(
      ADMIN_CATALOG_COPY.TESTIMONIALS.ERRORS.CONSENT_REQUIRED,
      { consentAt: [ADMIN_CATALOG_COPY.TESTIMONIALS.ERRORS.CONSENT_REQUIRED] },
    );
  }
  return date.toISOString();
}

export async function createAdminTestimonial(
  profile: AdminSessionProfile,
  rawBody: unknown,
  ctx: AdminRepoContext = {},
): Promise<AdminTestimonialItem> {
  assertOwner(profile, 'testimonial');
  const parsed = createAdminTestimonialInputSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new AdminCatalogValidationError(
      ADMIN_CATALOG_COPY.TESTIMONIALS.ERRORS.CONSENT_REQUIRED,
      formatZodFieldErrors(parsed.error),
    );
  }

  const normalizedConsentAt = normalizeOptionalIsoTimestamp(
    parsed.data.consentAt,
  );
  const normalizedConsentRef =
    parsed.data.consentReference &&
    parsed.data.consentReference.trim().length > 0
      ? parsed.data.consentReference.trim()
      : null;

  if (
    parsed.data.status === 'published' &&
    (!normalizedConsentAt || !normalizedConsentRef)
  ) {
    throw new AdminCatalogValidationError(
      ADMIN_CATALOG_COPY.TESTIMONIALS.ERRORS.CONSENT_REQUIRED,
      { consentAt: [ADMIN_CATALOG_COPY.TESTIMONIALS.ERRORS.CONSENT_REQUIRED] },
    );
  }

  const client = await createServerAuthClient(ctx.response);
  const query = client
    .from('testimonials')
    .insert({
      display_name: parsed.data.displayName,
      quote: parsed.data.quote,
      rating: parsed.data.rating,
      source_label: parsed.data.sourceLabel,
      source_url: parsed.data.sourceUrl,
      consent_reference: normalizedConsentRef,
      consent_at: normalizedConsentAt,
      sort_order: parsed.data.sortOrder,
      status: parsed.data.status,
    })
    .select(TESTIMONIAL_PUBLIC_TABLE_SELECT);
  if (ctx.signal) {
    query.abortSignal(ctx.signal);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    mapPostgresCmsError(error, 'testimonial');
  }
  if (!data) {
    throw new AdminCatalogUpstreamError();
  }

  return mapTestimonialRowToDto(data, {
    consentReference: normalizedConsentRef,
    consentAt: normalizedConsentAt,
  });
}

export async function updateAdminTestimonial(
  profile: AdminSessionProfile,
  testimonialId: string,
  rawBody: unknown,
  ctx: AdminRepoContext = {},
): Promise<AdminTestimonialItem> {
  assertOwner(profile, 'testimonial');
  const parsed = updateAdminTestimonialInputSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new AdminCatalogValidationError(
      ADMIN_CATALOG_COPY.TESTIMONIALS.ERRORS.CONSENT_REQUIRED,
      formatZodFieldErrors(parsed.error),
    );
  }

  const normalizedConsentAt = normalizeOptionalIsoTimestamp(
    parsed.data.consentAt,
  );
  const normalizedConsentRef =
    parsed.data.consentReference &&
    parsed.data.consentReference.trim().length > 0
      ? parsed.data.consentReference.trim()
      : null;

  if (
    parsed.data.status === 'published' &&
    (!normalizedConsentAt || !normalizedConsentRef)
  ) {
    throw new AdminCatalogValidationError(
      ADMIN_CATALOG_COPY.TESTIMONIALS.ERRORS.CONSENT_REQUIRED,
      { consentAt: [ADMIN_CATALOG_COPY.TESTIMONIALS.ERRORS.CONSENT_REQUIRED] },
    );
  }

  const client = await createServerAuthClient(ctx.response);
  const existsQuery = client
    .from('testimonials')
    .select('id,updated_at')
    .eq('id', testimonialId);
  if (ctx.signal) {
    existsQuery.abortSignal(ctx.signal);
  }
  const { data: existing, error: readErr } = await existsQuery.maybeSingle();
  if (readErr) {
    throw new AdminCatalogUpstreamError();
  }
  if (!existing) {
    throw new AdminCatalogNotFoundError();
  }
  if (existing.updated_at !== parsed.data.expectedUpdatedAt) {
    throw new AdminCatalogConflictError(
      ADMIN_CATALOG_COPY.TESTIMONIALS.ERRORS.STALE_CONFLICT,
    );
  }

  const updateQuery = client
    .from('testimonials')
    .update({
      display_name: parsed.data.displayName,
      quote: parsed.data.quote,
      rating: parsed.data.rating,
      source_label: parsed.data.sourceLabel,
      source_url: parsed.data.sourceUrl,
      consent_reference: normalizedConsentRef,
      consent_at: normalizedConsentAt,
      sort_order: parsed.data.sortOrder,
      status: parsed.data.status,
    })
    .eq('id', testimonialId)
    .eq('updated_at', parsed.data.expectedUpdatedAt)
    .select(TESTIMONIAL_PUBLIC_TABLE_SELECT);
  if (ctx.signal) {
    updateQuery.abortSignal(ctx.signal);
  }

  const { data, error } = await updateQuery.maybeSingle();
  if (error) {
    mapPostgresCmsError(error, 'testimonial');
  }
  if (!data) {
    throw new AdminCatalogConflictError(
      ADMIN_CATALOG_COPY.TESTIMONIALS.ERRORS.STALE_CONFLICT,
    );
  }

  const evidence = await readOwnerEvidenceForTestimonial(testimonialId, ctx);
  return mapTestimonialRowToDto(data, {
    consentReference: evidence.consentReference ?? normalizedConsentRef,
    consentAt: evidence.consentAt ?? normalizedConsentAt,
  });
}

export async function archiveAdminTestimonial(
  profile: AdminSessionProfile,
  testimonialId: string,
  rawBody: unknown,
  ctx: AdminRepoContext = {},
): Promise<AdminTestimonialItem> {
  assertOwner(profile, 'testimonial');
  const parsed = archiveAdminCmsEntityInputSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new AdminCatalogValidationError(
      ADMIN_CATALOG_COPY.CMS.ERRORS.UNSAFE_TEXT,
      formatZodFieldErrors(parsed.error),
    );
  }

  const client = await createServerAuthClient(ctx.response);
  const existsQuery = client
    .from('testimonials')
    .select('id,updated_at')
    .eq('id', testimonialId);
  if (ctx.signal) {
    existsQuery.abortSignal(ctx.signal);
  }
  const { data: existing, error: readErr } = await existsQuery.maybeSingle();
  if (readErr) {
    throw new AdminCatalogUpstreamError();
  }
  if (!existing) {
    throw new AdminCatalogNotFoundError();
  }
  if (existing.updated_at !== parsed.data.expectedUpdatedAt) {
    throw new AdminCatalogConflictError(
      ADMIN_CATALOG_COPY.TESTIMONIALS.ERRORS.STALE_CONFLICT,
    );
  }

  const archiveQuery = client
    .from('testimonials')
    .update({ status: 'archived' })
    .eq('id', testimonialId)
    .eq('updated_at', parsed.data.expectedUpdatedAt)
    .select(TESTIMONIAL_PUBLIC_TABLE_SELECT);
  if (ctx.signal) {
    archiveQuery.abortSignal(ctx.signal);
  }

  const { data, error } = await archiveQuery.maybeSingle();
  if (error) {
    mapPostgresCmsError(error, 'testimonial');
  }
  if (!data) {
    throw new AdminCatalogConflictError(
      ADMIN_CATALOG_COPY.TESTIMONIALS.ERRORS.STALE_CONFLICT,
    );
  }

  const evidence = await readOwnerEvidenceForTestimonial(testimonialId, ctx);
  return mapTestimonialRowToDto(data, evidence);
}
