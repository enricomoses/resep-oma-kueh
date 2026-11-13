import { AUTH_LIMITS } from '@/constants/auth.constant';
import { assertSameOriginRequest } from '@/features/auth/csrf.server';
import {
  createAuthJsonError,
  createAuthJsonSuccess,
  createCookieCarrierResponse,
  parseWithSchema,
  readBoundedJsonBody,
} from '@/features/auth/http.server';
import { updateAdminPassword } from '@/features/auth/service.server';
import {
  updatePasswordRequestSchema,
  updatePasswordResponseSchema,
} from '@/validations/auth.schema';

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const carrier = createCookieCarrierResponse();

  try {
    assertSameOriginRequest(request);
    const body = await readBoundedJsonBody(
      request,
      AUTH_LIMITS.MAX_REQUEST_BYTES,
    );
    const input = parseWithSchema(updatePasswordRequestSchema, body);
    const result = await updateAdminPassword(input.password, carrier);
    return createAuthJsonSuccess(
      result,
      updatePasswordResponseSchema,
      requestId,
      carrier,
    );
  } catch (err) {
    return createAuthJsonError(err, requestId, carrier);
  }
}
