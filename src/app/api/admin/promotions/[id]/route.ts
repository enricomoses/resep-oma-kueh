import { ADMIN_CATALOG_LIMITS } from '@/constants/admin-catalog.constant';
import {
  parseUuidRouteParam,
  revalidatePublicPromotionPaths,
} from '@/features/admin-catalog/http.server';
import {
  archiveAdminPromotion,
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
import { adminPromotionMutationResponseSchema } from '@/validations/promotion.schema';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
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
    const promotionId = parseUuidRouteParam(id);
    const body = await readBoundedJsonBody(
      request,
      ADMIN_CATALOG_LIMITS.MAX_BODY_BYTES,
    );
    const promotion = await saveAdminPromotion(profile, promotionId, body, {
      response: carrier,
      signal: request.signal,
    });
    revalidatePublicPromotionPaths();

    return createAuthJsonSuccess(
      { promotion },
      adminPromotionMutationResponseSchema,
      requestId,
      carrier,
    );
  } catch (err) {
    return createAuthJsonError(err, requestId, carrier);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
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
    const promotionId = parseUuidRouteParam(id);
    const body = await readBoundedJsonBody(
      request,
      ADMIN_CATALOG_LIMITS.MAX_BODY_BYTES,
    );
    const promotion = await archiveAdminPromotion(profile, promotionId, body, {
      response: carrier,
      signal: request.signal,
    });
    revalidatePublicPromotionPaths();

    return createAuthJsonSuccess(
      { promotion },
      adminPromotionMutationResponseSchema,
      requestId,
      carrier,
    );
  } catch (err) {
    return createAuthJsonError(err, requestId, carrier);
  }
}
