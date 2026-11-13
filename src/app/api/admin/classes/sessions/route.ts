import { ADMIN_CATALOG_LIMITS } from '@/constants/admin-catalog.constant';
import {
  createAdminClassSession,
  listAdminClassSessions,
} from '@/features/admin-catalog/classes.server';
import { requireApiAdmin } from '@/features/auth/admin-guard.server';
import { assertSameOriginRequest } from '@/features/auth/csrf.server';
import { AuthInvalidRequestError } from '@/features/auth/errors.server';
import {
  createAuthJsonError,
  createAuthJsonSuccess,
  createCookieCarrierResponse,
  parseWithSchema,
  readBoundedJsonBody,
} from '@/features/auth/http.server';
import {
  adminClassSessionMutationDataSchema,
  adminClassSessionsDataSchema,
  adminClassSessionsQuerySchema,
  createAdminClassSessionInputSchema,
} from '@/validations/classes.schema';

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const carrier = createCookieCarrierResponse();

  try {
    const profile = await requireApiAdmin({
      roles: ['owner', 'branch_admin'],
      response: carrier,
    });
    const searchParams = new URL(request.url).searchParams;
    const parsedQuery = adminClassSessionsQuerySchema.safeParse({
      branchId: searchParams.get('branchId') || undefined,
      programId: searchParams.get('programId') || undefined,
    });
    if (!parsedQuery.success) {
      throw new AuthInvalidRequestError('Filter sesi kelas tidak valid.');
    }

    const result = await listAdminClassSessions(profile, parsedQuery.data, {
      response: carrier,
      signal: request.signal,
    });

    return createAuthJsonSuccess(
      result,
      adminClassSessionsDataSchema,
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
      roles: ['owner', 'branch_admin'],
      response: carrier,
    });
    const rawBody = await readBoundedJsonBody(
      request,
      ADMIN_CATALOG_LIMITS.MAX_BODY_BYTES,
    );
    const input = parseWithSchema(createAdminClassSessionInputSchema, rawBody);
    const item = await createAdminClassSession(profile, input, rawBody, {
      response: carrier,
      signal: request.signal,
    });

    return createAuthJsonSuccess(
      { item },
      adminClassSessionMutationDataSchema,
      requestId,
      carrier,
      201,
    );
  } catch (err) {
    return createAuthJsonError(err, requestId, carrier);
  }
}
