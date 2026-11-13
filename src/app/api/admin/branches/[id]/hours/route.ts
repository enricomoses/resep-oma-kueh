import { ADMIN_BRANCH_LIMITS } from '@/constants/admin-catalog.constant';
import { replaceAdminBranchHours } from '@/features/admin-catalog/branches.server';
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
  adminBranchMutationResponseSchema,
  replaceBranchHoursSchema,
} from '@/validations/admin-catalog.schema';

interface BranchHoursRouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, context: BranchHoursRouteContext) {
  const requestId = crypto.randomUUID();
  const carrier = createCookieCarrierResponse();

  try {
    assertSameOriginRequest(request);
    const profile = await requireApiAdmin({
      roles: ['owner'],
      response: carrier,
    });
    const { id } = await context.params;
    const branchId = parseUuidRouteParam(id);
    const rawBody = await readBoundedJsonBody(
      request,
      ADMIN_BRANCH_LIMITS.MAX_HOURS_BODY_BYTES,
    );
    const input = parseWithSchema(replaceBranchHoursSchema, rawBody);
    const branch = await replaceAdminBranchHours(profile, branchId, input, {
      response: carrier,
      signal: request.signal,
    });

    return createAuthJsonSuccess(
      { branch },
      adminBranchMutationResponseSchema,
      requestId,
      carrier,
    );
  } catch (err) {
    return createAuthJsonError(err, requestId, carrier);
  }
}
