import { ADMIN_BRANCH_LIMITS } from '@/constants/admin-catalog.constant';
import { bulkUpdateAdminAvailability } from '@/features/admin-catalog/availability.server';
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
  adminBulkAvailabilityResponseSchema,
  bulkUpdateAvailabilitySchema,
} from '@/validations/admin-catalog.schema';

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const carrier = createCookieCarrierResponse();

  try {
    assertSameOriginRequest(request);
    const profile = await requireApiAdmin({
      roles: ['owner', 'branch_admin'],
      response: carrier,
    });
    const rawBody = await readBoundedJsonBody(
      request,
      ADMIN_BRANCH_LIMITS.MAX_BULK_AVAILABILITY_BODY_BYTES,
    );
    const input = parseWithSchema(bulkUpdateAvailabilitySchema, rawBody);
    const result = await bulkUpdateAdminAvailability(profile, input, rawBody, {
      response: carrier,
      signal: request.signal,
    });

    return createAuthJsonSuccess(
      result,
      adminBulkAvailabilityResponseSchema,
      requestId,
      carrier,
    );
  } catch (err) {
    return createAuthJsonError(err, requestId, carrier);
  }
}
