import { listAdminAvailability } from '@/features/admin-catalog/availability.server';
import { requireApiAdmin } from '@/features/auth/admin-guard.server';
import {
  createAuthJsonError,
  createAuthJsonSuccess,
  createCookieCarrierResponse,
  parseWithSchema,
} from '@/features/auth/http.server';
import {
  adminAvailabilityListResponseSchema,
  adminAvailabilityQuerySchema,
} from '@/validations/admin-catalog.schema';

function extractAvailabilityQuery(urlString: string): Record<string, string> {
  const params = new URL(urlString).searchParams;
  const raw: Record<string, string> = {};

  for (const key of [
    'branchId',
    'search',
    'availabilityStatus',
    'listed',
    'page',
    'pageSize',
  ] as const) {
    const val = params.get(key);
    if (val !== null && val !== '') {
      raw[key] = val;
    }
  }

  return raw;
}

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const carrier = createCookieCarrierResponse();

  try {
    const profile = await requireApiAdmin({
      roles: ['owner', 'branch_admin'],
      response: carrier,
    });
    const query = parseWithSchema(
      adminAvailabilityQuerySchema,
      extractAvailabilityQuery(request.url),
    );
    const result = await listAdminAvailability(profile, query, {
      response: carrier,
      signal: request.signal,
    });

    return createAuthJsonSuccess(
      result,
      adminAvailabilityListResponseSchema,
      requestId,
      carrier,
    );
  } catch (err) {
    return createAuthJsonError(err, requestId, carrier);
  }
}
