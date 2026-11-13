import { listAdminCmsEntries } from '@/features/admin-catalog/cms-content.server';
import { requireApiAdmin } from '@/features/auth/admin-guard.server';
import {
  createAuthJsonError,
  createAuthJsonSuccess,
  createCookieCarrierResponse,
} from '@/features/auth/http.server';
import { adminCmsListResponseSchema } from '@/validations/admin-cms.schema';

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const carrier = createCookieCarrierResponse();

  try {
    const profile = await requireApiAdmin({
      roles: ['owner'],
      response: carrier,
    });
    const result = await listAdminCmsEntries(profile, {
      response: carrier,
      signal: request.signal,
    });

    return createAuthJsonSuccess(
      result,
      adminCmsListResponseSchema,
      requestId,
      carrier,
    );
  } catch (err) {
    return createAuthJsonError(err, requestId, carrier);
  }
}
