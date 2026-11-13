import { ADMIN_CATALOG_LIMITS } from '@/constants/admin-catalog.constant';
import {
  createAdminClassProgram,
  listAdminClassPrograms,
} from '@/features/admin-catalog/classes.server';
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
  adminClassProgramMutationDataSchema,
  adminClassProgramsDataSchema,
  createAdminClassProgramInputSchema,
} from '@/validations/classes.schema';

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const carrier = createCookieCarrierResponse();

  try {
    const profile = await requireApiAdmin({
      roles: ['owner', 'branch_admin'],
      response: carrier,
    });
    const result = await listAdminClassPrograms(profile, {
      response: carrier,
      signal: request.signal,
    });

    return createAuthJsonSuccess(
      result,
      adminClassProgramsDataSchema,
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
    const rawBody = await readBoundedJsonBody(
      request,
      ADMIN_CATALOG_LIMITS.MAX_BODY_BYTES,
    );
    const input = parseWithSchema(createAdminClassProgramInputSchema, rawBody);
    const item = await createAdminClassProgram(profile, input, {
      response: carrier,
      signal: request.signal,
    });

    return createAuthJsonSuccess(
      { item },
      adminClassProgramMutationDataSchema,
      requestId,
      carrier,
      201,
    );
  } catch (err) {
    return createAuthJsonError(err, requestId, carrier);
  }
}
