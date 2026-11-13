import { ADMIN_CATALOG_LIMITS } from '@/constants/admin-catalog.constant';
import { ERROR_COPY } from '@/constants/copy.constant';
import {
  rejectProductPriceFields,
  revalidatePublicCatalogPaths,
} from '@/features/admin-catalog/http.server';
import {
  createAdminProduct,
  listAdminProducts,
} from '@/features/admin-catalog/service.server';
import { requireApiAdmin } from '@/features/auth/admin-guard.server';
import { assertSameOriginRequest } from '@/features/auth/csrf.server';
import { AuthInvalidRequestError } from '@/features/auth/errors.server';
import {
  createAuthJsonError,
  createAuthJsonSuccess,
  createCookieCarrierResponse,
  parseWithSchema,
  readBoundedJsonBody,
} from '@/features/auth/http.server';
import {
  adminProductDetailResponseSchema,
  adminProductListResponseSchema,
  adminProductQuerySchema,
  createAdminProductSchema,
} from '@/validations/admin-catalog.schema';

const ALLOWED_PRODUCT_QUERY_KEYS = new Set([
  'q',
  'status',
  'categoryId',
  'page',
  'limit',
]);

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const carrier = createCookieCarrierResponse();

  try {
    const profile = await requireApiAdmin({
      roles: ['owner'],
      response: carrier,
    });

    const params = new URL(request.url).searchParams;
    for (const key of params.keys()) {
      if (
        !ALLOWED_PRODUCT_QUERY_KEYS.has(key) ||
        params.getAll(key).length > 1
      ) {
        throw new AuthInvalidRequestError(ERROR_COPY.INVALID_REQUEST);
      }
    }

    const rawEntries: Record<string, string> = {};
    params.forEach((value, key) => {
      if (value.trim().length > 0) {
        rawEntries[key] = value;
      }
    });

    const query = parseWithSchema(adminProductQuerySchema, rawEntries);
    const data = await listAdminProducts(profile, query, {
      response: carrier,
      signal: request.signal,
    });
    return createAuthJsonSuccess(
      data,
      adminProductListResponseSchema,
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
    rejectProductPriceFields(rawBody);
    const input = parseWithSchema(createAdminProductSchema, rawBody);
    const product = await createAdminProduct(profile, input, {
      response: carrier,
      signal: request.signal,
    });
    revalidatePublicCatalogPaths();
    return createAuthJsonSuccess(
      { product },
      adminProductDetailResponseSchema,
      requestId,
      carrier,
      201,
    );
  } catch (err) {
    return createAuthJsonError(err, requestId, carrier);
  }
}
