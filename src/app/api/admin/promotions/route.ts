import { ADMIN_CATALOG_LIMITS } from '@/constants/admin-catalog.constant';
import { revalidatePublicPromotionPaths } from '@/features/admin-catalog/http.server';
import {
  listAdminPromotions,
  saveAdminPromotion,
} from '@/features/admin-catalog/promotions.server';
import { requireApiAdmin } from '@/features/auth/admin-guard.server';
import { assertSameOriginRequest } from '@/features/auth/csrf.server';
import {
  createAuthJsonError,
  createAuthJsonSuccess,
  createCookieCarrierResponse,
  readBoundedJsonBody,
} from '@/features/auth/http.server';
import {
  adminPromotionMutationResponseSchema,
  adminPromotionsListResponseSchema,
} from '@/validations/promotion.schema';

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const carrier = createCookieCarrierResponse();

  try {
    const profile = await requireApiAdmin({
      roles: ['owner'],
      response: carrier,
    });
    const result = await listAdminPromotions(profile, {
      response: carrier,
      signal: request.signal,
    });

    return createAuthJsonSuccess(
      result,
      adminPromotionsListResponseSchema,
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
    const body = await readBoundedJsonBody(
      request,
      ADMIN_CATALOG_LIMITS.MAX_BODY_BYTES,
    );
    const promotion = await saveAdminPromotion(profile, null, body, {
      response: carrier,
      signal: request.signal,
    });
    revalidatePublicPromotionPaths();

    return createAuthJsonSuccess(
      { promotion },
      adminPromotionMutationResponseSchema,
      requestId,
      carrier,
      201,
    );
  } catch (err) {
    return createAuthJsonError(err, requestId, carrier);
  }
}
