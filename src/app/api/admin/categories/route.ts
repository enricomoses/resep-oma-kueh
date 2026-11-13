import { ADMIN_CATALOG_LIMITS } from '@/constants/admin-catalog.constant';
import { revalidatePublicCatalogPaths } from '@/features/admin-catalog/http.server';
import {
  createAdminCategory,
  listAdminCategories,
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
  adminCategoryListResponseSchema,
  createAdminCategorySchema,
} from '@/validations/admin-catalog.schema';

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const carrier = createCookieCarrierResponse();

  try {
    const profile = await requireApiAdmin({
      roles: ['owner'],
      response: carrier,
    });
    const data = await listAdminCategories(profile, {
      response: carrier,
      signal: request.signal,
    });
    return createAuthJsonSuccess(
      data,
      adminCategoryListResponseSchema,
      requestId,
      carrier,
    );
  } catch (err) {
    return createAuthJsonError(err, requestId, carrier);
  }
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const carrier = createCookieCarrierResponse();

  try {
    assertSameOriginRequest(request);
    const profile = await requireApiAdmin({
      roles: ['owner'],
      response: carrier,
    });
    const rawBody = await readBoundedJsonBody(
      request,
      ADMIN_CATALOG_LIMITS.MAX_BODY_BYTES,
    );
    const input = parseWithSchema(createAdminCategorySchema, rawBody);
    const category = await createAdminCategory(profile, input, {
      response: carrier,
      signal: request.signal,
    });
    revalidatePublicCatalogPaths();
    return createAuthJsonSuccess(
      { category },
      adminCategoryDetailResponseSchema,
      requestId,
      carrier,
      201,
    );
  } catch (err) {
    return createAuthJsonError(err, requestId, carrier);
  }
}
