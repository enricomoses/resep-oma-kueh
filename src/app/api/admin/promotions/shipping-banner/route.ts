import { ADMIN_CATALOG_LIMITS } from '@/constants/admin-catalog.constant';
import { revalidatePublicPromotionPaths } from '@/features/admin-catalog/http.server';
import { saveAdminShippingBanner } from '@/features/admin-catalog/promotions.server';
import { requireApiAdmin } from '@/features/auth/admin-guard.server';
import { assertSameOriginRequest } from '@/features/auth/csrf.server';
import {
  createAuthJsonError,
  createAuthJsonSuccess,
  createCookieCarrierResponse,
  readBoundedJsonBody,
} from '@/features/auth/http.server';
import { adminShippingBannerMutationResponseSchema } from '@/validations/promotion.schema';

export async function PUT(request: Request) {
  const requestId = crypto.randomUUID();
  const carrier = createCookieCarrierResponse();

  try {
    assertSameOriginRequest(request);
    const profile = await requireApiAdmin({
      roles: ['owner'],
      response: carrier,
    });
    const body = await readBoundedJsonBody(
      request,
      ADMIN_CATALOG_LIMITS.MAX_BODY_BYTES,
    );
    const shippingBanner = await saveAdminShippingBanner(profile, body, {
      response: carrier,
      signal: request.signal,
    });
    revalidatePublicPromotionPaths();

    return createAuthJsonSuccess(
      { shippingBanner },
      adminShippingBannerMutationResponseSchema,
      requestId,
      carrier,
    );
  } catch (err) {
    return createAuthJsonError(err, requestId, carrier);
  }
}
