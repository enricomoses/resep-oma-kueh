import { ADMIN_CATALOG_LIMITS } from '@/constants/admin-catalog.constant';
import {
  readAdminCmsEntry,
  saveAdminCmsEntry,
} from '@/features/admin-catalog/cms-content.server';
import {
  revalidatePublicContentPaths,
  revalidatePublicPromotionPaths,
} from '@/features/admin-catalog/http.server';
import { requireApiAdmin } from '@/features/auth/admin-guard.server';
import { assertSameOriginRequest } from '@/features/auth/csrf.server';
import {
  createAuthJsonError,
  createAuthJsonSuccess,
  createCookieCarrierResponse,
  readBoundedJsonBody,
} from '@/features/auth/http.server';
import { adminCmsMutationResponseSchema } from '@/validations/admin-cms.schema';

export async function GET(
  request: Request,
  context: { params: Promise<{ key: string }> },
) {
  const requestId = crypto.randomUUID();
  const carrier = createCookieCarrierResponse();

  try {
    const profile = await requireApiAdmin({
      roles: ['owner'],
      response: carrier,
    });
    const { key } = await context.params;
    const item = await readAdminCmsEntry(profile, decodeURIComponent(key), {
      response: carrier,
      signal: request.signal,
    });

    return createAuthJsonSuccess(
      { item },
      adminCmsMutationResponseSchema,
      requestId,
      carrier,
    );
  } catch (err) {
    return createAuthJsonError(err, requestId, carrier);
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ key: string }> },
) {
  const requestId = crypto.randomUUID();
  const carrier = createCookieCarrierResponse();

  try {
    assertSameOriginRequest(request);
    const profile = await requireApiAdmin({
      roles: ['owner'],
      response: carrier,
    });
    const { key } = await context.params;
    const decodedKey = decodeURIComponent(key);
    const body = await readBoundedJsonBody(
      request,
      ADMIN_CATALOG_LIMITS.MAX_BODY_BYTES,
    );
    const item = await saveAdminCmsEntry(profile, decodedKey, body, {
      response: carrier,
      signal: request.signal,
    });
    revalidatePublicContentPaths();
    if (decodedKey === 'promo.shipping_banner') {
      revalidatePublicPromotionPaths();
    }

    return createAuthJsonSuccess(
      { item },
      adminCmsMutationResponseSchema,
      requestId,
      carrier,
    );
  } catch (err) {
    return createAuthJsonError(err, requestId, carrier);
  }
}
