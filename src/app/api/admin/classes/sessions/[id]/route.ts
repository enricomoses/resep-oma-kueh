import { ADMIN_CATALOG_LIMITS } from '@/constants/admin-catalog.constant';
import {
  cancelAdminClassSession,
  updateAdminClassSession,
} from '@/features/admin-catalog/classes.server';
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
  adminClassArchiveInputSchema,
  adminClassSessionMutationDataSchema,
  updateAdminClassSessionInputSchema,
} from '@/validations/classes.schema';

interface SessionRouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: SessionRouteContext) {
  const requestId = crypto.randomUUID();
  const carrier = createCookieCarrierResponse();

  try {
    assertSameOriginRequest(request);
    const profile = await requireApiAdmin({
      roles: ['owner', 'branch_admin'],
      response: carrier,
    });
    const { id: rawId } = await context.params;
    const sessionId = parseUuidRouteParam(rawId);
    const rawBody = await readBoundedJsonBody(
      request,
      ADMIN_CATALOG_LIMITS.MAX_BODY_BYTES,
    );
    const input = parseWithSchema(updateAdminClassSessionInputSchema, rawBody);
    const item = await updateAdminClassSession(
      profile,
      sessionId,
      input,
      rawBody,
      { response: carrier, signal: request.signal },
    );

    return createAuthJsonSuccess(
      { item },
      adminClassSessionMutationDataSchema,
      requestId,
      carrier,
    );
  } catch (err) {
    return createAuthJsonError(err, requestId, carrier);
  }
}

export async function DELETE(request: Request, context: SessionRouteContext) {
  const requestId = crypto.randomUUID();
  const carrier = createCookieCarrierResponse();

  try {
    assertSameOriginRequest(request);
    const profile = await requireApiAdmin({
      roles: ['owner', 'branch_admin'],
      response: carrier,
    });
    const { id: rawId } = await context.params;
    const sessionId = parseUuidRouteParam(rawId);
    const rawBody = await readBoundedJsonBody(
      request,
      ADMIN_CATALOG_LIMITS.MAX_BODY_BYTES,
    );
    const parsed = parseWithSchema(adminClassArchiveInputSchema, rawBody);
    const item = await cancelAdminClassSession(
      profile,
      sessionId,
      parsed.expectedUpdatedAt,
      { response: carrier, signal: request.signal },
    );

    return createAuthJsonSuccess(
      { item },
      adminClassSessionMutationDataSchema,
      requestId,
      carrier,
    );
  } catch (err) {
    return createAuthJsonError(err, requestId, carrier);
  }
}
