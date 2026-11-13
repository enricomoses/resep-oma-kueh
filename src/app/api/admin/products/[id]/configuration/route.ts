import { ADMIN_CATALOG_LIMITS } from '@/constants/admin-catalog.constant';
import { saveAdminProductConfiguration } from '@/features/admin-catalog/configuration.server';
import {
  parseUuidRouteParam,
  rejectProductPriceFields,
} from '@/features/admin-catalog/http.server';
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
  adminSaveConfigurationResponseSchema,
  saveProductConfigurationSchema,
} from '@/validations/admin-catalog.schema';

interface ConfigurationRouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(
  request: Request,
  context: ConfigurationRouteContext,
) {
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
      ADMIN_CATALOG_LIMITS.MAX_CONFIGURATION_BODY_BYTES,
    );
    rejectProductPriceFields(rawBody);
    if (rawBody && typeof rawBody === 'object' && 'product' in rawBody) {
      rejectProductPriceFields((rawBody as { product?: unknown }).product);
    }

    const input = parseWithSchema(saveProductConfigurationSchema, rawBody);
    const result = await saveAdminProductConfiguration(
      profile,
      productId,
      input,
      {
        response: carrier,
        signal: request.signal,
      },
    );

    return createAuthJsonSuccess(
      result,
      adminSaveConfigurationResponseSchema,
      requestId,
      carrier,
    );
  } catch (err) {
    return createAuthJsonError(err, requestId, carrier);
  }
}
