import { listAdminBranches } from '@/features/admin-catalog/branches.server';
import { requireApiAdmin } from '@/features/auth/admin-guard.server';
import {
  createAuthJsonError,
  createAuthJsonSuccess,
  createCookieCarrierResponse,
} from '@/features/auth/http.server';
import { adminBranchesResponseSchema } from '@/validations/admin-catalog.schema';

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const carrier = createCookieCarrierResponse();

  try {
    const profile = await requireApiAdmin({
      roles: ['owner'],
      response: carrier,
    });
    const result = await listAdminBranches(profile, {
      response: carrier,
      signal: request.signal,
    });

    return createAuthJsonSuccess(
      result,
      adminBranchesResponseSchema,
      requestId,
      carrier,
    );
  } catch (err) {
    return createAuthJsonError(err, requestId, carrier);
  }
}
