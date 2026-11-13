import { AUTH_LIMITS } from '@/constants/auth.constant';
import { assertSameOriginRequest } from '@/features/auth/csrf.server';
import {
  createAuthJsonError,
  createAuthJsonSuccess,
  createCookieCarrierResponse,
  parseWithSchema,
  readBoundedJsonBody,
} from '@/features/auth/http.server';
import { extractClientIpHash } from '@/features/auth/rate-limit.server';
import { loginAdmin } from '@/features/auth/service.server';
import {
  loginRequestSchema,
  loginResponseSchema,
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
    const input = parseWithSchema(loginRequestSchema, body);
    const result = await loginAdmin(input, {
      ipHash: extractClientIpHash(request),
      carrier,
    });
    return createAuthJsonSuccess(
      result,
      loginResponseSchema,
      requestId,
      carrier,
    );
  } catch (err) {
    return createAuthJsonError(err, requestId, carrier);
  }
}
