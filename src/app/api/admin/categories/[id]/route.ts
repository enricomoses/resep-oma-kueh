import { ADMIN_CATALOG_LIMITS } from '@/constants/admin-catalog.constant';
import {
  parseUuidRouteParam,
  rejectImmutableSlugOnPatch,
  revalidatePublicCatalogPaths,
  stripUnchangedSlugForPatch,
} from '@/features/admin-catalog/http.server';
import {
  archiveAdminCategory,
  getAdminCategoryById,
  updateAdminCategory,
} from '@/features/admin-catalog/service.server';
import { requireApiAdmin } from '@/features/auth/admin-guard.server';
import { assertSameOriginRequest } from '@/features/auth/csrf.server';
import {
  createAuthJsonError,
  createAuthJsonSuccess,
  createCookieCarrierResponse,
  parseWithSchema,
  readBoundedJsonBody,
} from '@/features/auth/http.server';
import {
  adminCategoryDetailResponseSchema,
  archiveAdminEntitySchema,
  updateAdminCategorySchema,
} from '@/validations/admin-catalog.schema';

interface CategoryRouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: CategoryRouteContext) {
  const requestId = crypto.randomUUID();
  const carrier = createCookieCarrierResponse();

  try {
    const profile = await requireApiAdmin({
      roles: ['owner'],
      response: carrier,
    });
    const { id } = await context.params;
    const categoryId = parseUuidRouteParam(id);
    const category = await getAdminCategoryById(profile, categoryId, {
      response: carrier,
      signal: request.signal,
    });
    return createAuthJsonSuccess(
      { category },
      adminCategoryDetailResponseSchema,
      requestId,
      carrier,
    );
  } catch (err) {
    return createAuthJsonError(err, requestId, carrier);
  }
}

export async function PATCH(request: Request, context: CategoryRouteContext) {
  const requestId = crypto.randomUUID();
  const carrier = createCookieCarrierResponse();

  try {
    assertSameOriginRequest(request);
    const profile = await requireApiAdmin({
      roles: ['owner'],
      response: carrier,
    });
    const { id } = await context.params;
    const categoryId = parseUuidRouteParam(id);
    const rawBody = await readBoundedJsonBody(
      request,
      ADMIN_CATALOG_LIMITS.MAX_BODY_BYTES,
    );

    const existing = await getAdminCategoryById(profile, categoryId, {
      response: carrier,
      signal: request.signal,
    });
    rejectImmutableSlugOnPatch(rawBody, existing.slug, 'category');
    const normalizedBody = stripUnchangedSlugForPatch(rawBody);
    const input = parseWithSchema(updateAdminCategorySchema, normalizedBody);

    const category = await updateAdminCategory(profile, categoryId, input, {
      response: carrier,
      signal: request.signal,
    });
    revalidatePublicCatalogPaths();
    return createAuthJsonSuccess(
      { category },
      adminCategoryDetailResponseSchema,
      requestId,
      carrier,
    );
  } catch (err) {
    return createAuthJsonError(err, requestId, carrier);
  }
}

export async function DELETE(request: Request, context: CategoryRouteContext) {
  const requestId = crypto.randomUUID();
  const carrier = createCookieCarrierResponse();

  try {
    assertSameOriginRequest(request);
    const profile = await requireApiAdmin({
      roles: ['owner'],
      response: carrier,
    });
    const { id } = await context.params;
    const categoryId = parseUuidRouteParam(id);

    const expectedFromQuery = new URL(request.url).searchParams.get(
      'expectedUpdatedAt',
    );
    const rawBody = expectedFromQuery
      ? { expectedUpdatedAt: expectedFromQuery }
      : await readBoundedJsonBody(request, ADMIN_CATALOG_LIMITS.MAX_BODY_BYTES);
    const input = parseWithSchema(archiveAdminEntitySchema, rawBody);

    const category = await archiveAdminCategory(profile, categoryId, input, {
      response: carrier,
      signal: request.signal,
    });
    revalidatePublicCatalogPaths();
    return createAuthJsonSuccess(
      { category },
      adminCategoryDetailResponseSchema,
      requestId,
      carrier,
    );
  } catch (err) {
    return createAuthJsonError(err, requestId, carrier);
  }
}
