import { requireApiAdmin } from '@/features/auth/admin-guard.server';
import {
  createAuthJsonError,
  createAuthJsonSuccess,
  createCookieCarrierResponse,
} from '@/features/auth/http.server';
import { adminSessionResponseSchema } from '@/validations/auth.schema';

export async function GET() {
  const requestId = crypto.randomUUID();
  const carrier = createCookieCarrierResponse();

  try {
    const profile = await requireApiAdmin({ response: carrier });
    return createAuthJsonSuccess(
      { profile },
      adminSessionResponseSchema,
      requestId,
      carrier,
    );
  } catch (err) {
    return createAuthJsonError(err, requestId, carrier);
  }
}
