import { ADMIN_CATALOG_LIMITS } from '@/constants/admin-catalog.constant';
import {
  createAdminFaq,
  listAdminFaqs,
} from '@/features/admin-catalog/cms-faqs-testimonials.server';
import { revalidatePublicContentPaths } from '@/features/admin-catalog/http.server';
import { requireApiAdmin } from '@/features/auth/admin-guard.server';
import { assertSameOriginRequest } from '@/features/auth/csrf.server';
import {
  createAuthJsonError,
  createAuthJsonSuccess,
  createCookieCarrierResponse,
  readBoundedJsonBody,
} from '@/features/auth/http.server';
import {
  adminFaqListResponseSchema,
  adminFaqMutationResponseSchema,
} from '@/validations/admin-cms.schema';

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const carrier = createCookieCarrierResponse();

  try {
    const profile = await requireApiAdmin({
      roles: ['owner'],
      response: carrier,
    });
    const result = await listAdminFaqs(profile, {
      response: carrier,
      signal: request.signal,
    });

    return createAuthJsonSuccess(
      result,
      adminFaqListResponseSchema,
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
      roles: ['owner'],
      response: carrier,
    });
    const body = await readBoundedJsonBody(
      request,
      ADMIN_CATALOG_LIMITS.MAX_BODY_BYTES,
    );
    const faq = await createAdminFaq(profile, body, {
      response: carrier,
      signal: request.signal,
    });
    revalidatePublicContentPaths();

    return createAuthJsonSuccess(
      { faq },
      adminFaqMutationResponseSchema,
      requestId,
      carrier,
      201,
    );
  } catch (err) {
    return createAuthJsonError(err, requestId, carrier);
  }
}
