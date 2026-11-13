import { ADMIN_CATALOG_LIMITS } from '@/constants/admin-catalog.constant';
import {
  archiveAdminClassProgram,
  updateAdminClassProgram,
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
  adminClassProgramMutationDataSchema,
  updateAdminClassProgramInputSchema,
} from '@/validations/classes.schema';

interface ProgramRouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: ProgramRouteContext) {
  const requestId = crypto.randomUUID();
  const carrier = createCookieCarrierResponse();

  try {
    assertSameOriginRequest(request);
    const profile = await requireApiAdmin({
      roles: ['owner'],
      response: carrier,
    });
    const { id: rawId } = await context.params;
    const programId = parseUuidRouteParam(rawId);
    const rawBody = await readBoundedJsonBody(
      request,
      ADMIN_CATALOG_LIMITS.MAX_BODY_BYTES,
    );
    const item = await updateAdminClassProgram(
      profile,
      programId,
      rawBody,
      (cleaned) => parseWithSchema(updateAdminClassProgramInputSchema, cleaned),
      { response: carrier, signal: request.signal },
    );

    return createAuthJsonSuccess(
      { item },
      adminClassProgramMutationDataSchema,
      requestId,
      carrier,
    );
  } catch (err) {
    return createAuthJsonError(err, requestId, carrier);
  }
}

export async function DELETE(request: Request, context: ProgramRouteContext) {
  const requestId = crypto.randomUUID();
  const carrier = createCookieCarrierResponse();

  try {
    assertSameOriginRequest(request);
    const profile = await requireApiAdmin({
      roles: ['owner'],
      response: carrier,
    });
    const { id: rawId } = await context.params;
    const programId = parseUuidRouteParam(rawId);
    const rawBody = await readBoundedJsonBody(
      request,
      ADMIN_CATALOG_LIMITS.MAX_BODY_BYTES,
    );
    const parsed = parseWithSchema(adminClassArchiveInputSchema, rawBody);
    const item = await archiveAdminClassProgram(
      profile,
      programId,
      parsed.expectedUpdatedAt,
      { response: carrier, signal: request.signal },
    );

    return createAuthJsonSuccess(
      { item },
      adminClassProgramMutationDataSchema,
      requestId,
      carrier,
    );
  } catch (err) {
    return createAuthJsonError(err, requestId, carrier);
  }
}
