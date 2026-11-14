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
import { AuthError } from '@/features/auth/errors.server';
import { loginAdmin } from '@/features/auth/service.server';
import { logServerEvent } from '@/lib/logger.server';
import {
  loginRequestSchema,
  loginResponseSchema,
} from '@/validations/auth.schema';

export async function POST(request: Request) {
  const startedAt = Date.now();
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
    logServerEvent({
      requestId,
      route: '/api/auth/login',
      operation: 'admin_login',
      status: 200,
      durationMs: Date.now() - startedAt,
    });
    return createAuthJsonSuccess(
      result,
      loginResponseSchema,
      requestId,
      carrier,
    );
  } catch (err) {
    const status = err instanceof AuthError ? err.status : 500;
    const errorCode = err instanceof AuthError ? err.code : 'INTERNAL_ERROR';
    logServerEvent({
      requestId,
      route: '/api/auth/login',
      operation: 'admin_login',
      status,
      durationMs: Date.now() - startedAt,
      errorCode,
    });
    return createAuthJsonError(err, requestId, carrier);
  }
}
