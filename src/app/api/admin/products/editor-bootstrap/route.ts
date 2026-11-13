import { readAdminProductEditorBootstrap } from '@/features/admin-catalog/configuration.server';
import { requireApiAdmin } from '@/features/auth/admin-guard.server';
import {
  createAuthJsonError,
  createAuthJsonSuccess,
  createCookieCarrierResponse,
} from '@/features/auth/http.server';
import { adminProductBootstrapResponseSchema } from '@/validations/admin-catalog.schema';

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const carrier = createCookieCarrierResponse();

  try {
    const profile = await requireApiAdmin({
      roles: ['owner'],
      response: carrier,
    });
    const bootstrap = await readAdminProductEditorBootstrap(profile, {
      response: carrier,
      signal: request.signal,
    });
    return createAuthJsonSuccess(
      bootstrap,
      adminProductBootstrapResponseSchema,
      requestId,
      carrier,
    );
  } catch (err) {
    return createAuthJsonError(err, requestId, carrier);
  }
}
