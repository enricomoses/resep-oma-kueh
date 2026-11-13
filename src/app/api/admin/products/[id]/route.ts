import { ADMIN_CATALOG_LIMITS } from '@/constants/admin-catalog.constant';
import {
  parseUuidRouteParam,
  rejectImmutableSlugOnPatch,
  rejectProductPriceFields,
  revalidatePublicCatalogPaths,
  stripUnchangedSlugForPatch,
} from '@/features/admin-catalog/http.server';
import {
  archiveAdminProduct,
  getAdminProductById,
  updateAdminProduct,
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
  adminProductDetailResponseSchema,
  archiveAdminEntitySchema,
  updateAdminProductSchema,
} from '@/validations/admin-catalog.schema';

interface ProductRouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: ProductRouteContext) {
  const requestId = crypto.randomUUID();
  const carrier = createCookieCarrierResponse();

  try {
    const profile = await requireApiAdmin({
      roles: ['owner'],
      response: carrier,
    });
    const { id } = await context.params;
    const productId = parseUuidRouteParam(id);
    const product = await getAdminProductById(profile, productId, {
      response: carrier,
      signal: request.signal,
    });
    return createAuthJsonSuccess(
      { product },
      adminProductDetailResponseSchema,
      requestId,
      carrier,
    );
  } catch (err) {
    return createAuthJsonError(err, requestId, carrier);
  }
}

export async function PATCH(request: Request, context: ProductRouteContext) {
  const requestId = crypto.randomUUID();
  const carrier = createCookieCarrierResponse();

  try {
    assertSameOriginRequest(request);
    const profile = await requireApiAdmin({
      roles: ['owner'],
      response: carrier,
    });
    const { id } = await context.params;
    const productId = parseUuidRouteParam(id);
    const rawBody = await readBoundedJsonBody(
      request,
      ADMIN_CATALOG_LIMITS.MAX_BODY_BYTES,
    );
    rejectProductPriceFields(rawBody);

    const existing = await getAdminProductById(profile, productId, {
      response: carrier,
      signal: request.signal,
    });
    rejectImmutableSlugOnPatch(rawBody, existing.slug, 'product');
    const normalizedBody = stripUnchangedSlugForPatch(rawBody);
    const input = parseWithSchema(updateAdminProductSchema, normalizedBody);

    const product = await updateAdminProduct(profile, productId, input, {
      response: carrier,
      signal: request.signal,
    });
    revalidatePublicCatalogPaths();
    return createAuthJsonSuccess(
      { product },
      adminProductDetailResponseSchema,
      requestId,
      carrier,
    );
  } catch (err) {
    return createAuthJsonError(err, requestId, carrier);
  }
}

export async function DELETE(request: Request, context: ProductRouteContext) {
  const requestId = crypto.randomUUID();
  const carrier = createCookieCarrierResponse();

  try {
    assertSameOriginRequest(request);
    const profile = await requireApiAdmin({
      roles: ['owner'],
      response: carrier,
    });
    const { id } = await context.params;
    const productId = parseUuidRouteParam(id);

    const expectedFromQuery = new URL(request.url).searchParams.get(
      'expectedUpdatedAt',
    );
    const rawBody = expectedFromQuery
      ? { expectedUpdatedAt: expectedFromQuery }
      : await readBoundedJsonBody(request, ADMIN_CATALOG_LIMITS.MAX_BODY_BYTES);
    const input = parseWithSchema(archiveAdminEntitySchema, rawBody);

    const product = await archiveAdminProduct(profile, productId, input, {
      response: carrier,
      signal: request.signal,
    });
    revalidatePublicCatalogPaths();
    return createAuthJsonSuccess(
      { product },
      adminProductDetailResponseSchema,
      requestId,
      carrier,
    );
  } catch (err) {
    return createAuthJsonError(err, requestId, carrier);
  }
}
