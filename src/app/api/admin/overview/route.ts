import { getAdminOverview } from '@/features/admin-catalog/service.server';
import { requireApiAdmin } from '@/features/auth/admin-guard.server';
import {
  createAuthJsonError,
  createAuthJsonSuccess,
  createCookieCarrierResponse,
} from '@/features/auth/http.server';
import { adminOverviewResponseSchema } from '@/validations/admin-catalog.schema';

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const carrier = createCookieCarrierResponse();

  try {
    const profile = await requireApiAdmin({ response: carrier });
    const data = await getAdminOverview(profile, {
      response: carrier,
      signal: request.signal,
    });
    return createAuthJsonSuccess(
      data,
      adminOverviewResponseSchema,
      requestId,
      carrier,
    );
  } catch (err) {
    return createAuthJsonError(err, requestId, carrier);
  }
}
