import { AUTH_LIMITS } from '@/constants/auth.constant';
import {
  assertSameOriginRequest,
  resolveTrustedRedirectOrigin,
} from '@/features/auth/csrf.server';
import {
  createAuthJsonError,
  createAuthJsonSuccess,
  createCookieCarrierResponse,
  parseWithSchema,
  readBoundedJsonBody,
} from '@/features/auth/http.server';
import { extractClientIpHash } from '@/features/auth/rate-limit.server';
import { requestAdminPasswordReset } from '@/features/auth/service.server';
import {
  passwordResetRequestSchema,
  passwordResetResponseSchema,
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
    const input = parseWithSchema(passwordResetRequestSchema, body);
    const result = await requestAdminPasswordReset(input.email, {
      ipHash: extractClientIpHash(request),
      redirectOrigin: resolveTrustedRedirectOrigin(request),
      carrier,
    });
    return createAuthJsonSuccess(
      result,
      passwordResetResponseSchema,
      requestId,
      carrier,
    );
  } catch (err) {
    return createAuthJsonError(err, requestId, carrier);
  }
}
