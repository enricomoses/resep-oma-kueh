import { ADMIN_BRANCH_LIMITS } from '@/constants/admin-catalog.constant';
import { upsertAdminAvailabilityOffer } from '@/features/admin-catalog/availability.server';
import { parseUuidRouteParam } from '@/features/admin-catalog/http.server';
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
  adminAvailabilityUpsertResponseSchema,
  upsertBranchAvailabilitySchema,
} from '@/validations/admin-catalog.schema';

interface AvailabilityOfferRouteContext {
  params: Promise<{ branchId: string; variantId: string }>;
}

export async function PUT(
  request: Request,
  context: AvailabilityOfferRouteContext,
) {
  const requestId = crypto.randomUUID();
  const carrier = createCookieCarrierResponse();

  try {
    assertSameOriginRequest(request);
    const profile = await requireApiAdmin({
      roles: ['owner', 'branch_admin'],
      response: carrier,
    });
    const { branchId: rawBranchId, variantId: rawVariantId } =
      await context.params;
    const branchId = parseUuidRouteParam(rawBranchId);
    const variantId = parseUuidRouteParam(rawVariantId);
    const rawBody = await readBoundedJsonBody(
      request,
      ADMIN_BRANCH_LIMITS.MAX_AVAILABILITY_BODY_BYTES,
    );
    const input = parseWithSchema(upsertBranchAvailabilitySchema, rawBody);
    const offer = await upsertAdminAvailabilityOffer(
      profile,
      branchId,
      variantId,
      input,
      rawBody,
      {
        response: carrier,
        signal: request.signal,
      },
    );

    return createAuthJsonSuccess(
      { offer },
      adminAvailabilityUpsertResponseSchema,
      requestId,
      carrier,
    );
  } catch (err) {
    return createAuthJsonError(err, requestId, carrier);
  }
}
