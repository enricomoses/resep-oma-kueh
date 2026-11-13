import { ADMIN_CATALOG_LIMITS } from '@/constants/admin-catalog.constant';
import {
  archiveAdminTestimonial,
  updateAdminTestimonial,
} from '@/features/admin-catalog/cms-faqs-testimonials.server';
import {
  parseUuidRouteParam,
  revalidatePublicContentPaths,
} from '@/features/admin-catalog/http.server';
import { requireApiAdmin } from '@/features/auth/admin-guard.server';
import { assertSameOriginRequest } from '@/features/auth/csrf.server';
import {
  createAuthJsonError,
  createAuthJsonSuccess,
  createCookieCarrierResponse,
  readBoundedJsonBody,
} from '@/features/auth/http.server';
import { adminTestimonialMutationResponseSchema } from '@/validations/admin-cms.schema';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const requestId = crypto.randomUUID();
  const carrier = createCookieCarrierResponse();

  try {
    assertSameOriginRequest(request);
    const profile = await requireApiAdmin({
      roles: ['owner'],
      response: carrier,
    });
    const { id } = await context.params;
    const testimonialId = parseUuidRouteParam(id);
    const body = await readBoundedJsonBody(
      request,
      ADMIN_CATALOG_LIMITS.MAX_BODY_BYTES,
    );
    const testimonial = await updateAdminTestimonial(
      profile,
      testimonialId,
      body,
      {
        response: carrier,
        signal: request.signal,
      },
    );
    revalidatePublicContentPaths();

    return createAuthJsonSuccess(
      { testimonial },
      adminTestimonialMutationResponseSchema,
      requestId,
      carrier,
    );
  } catch (err) {
    return createAuthJsonError(err, requestId, carrier);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const requestId = crypto.randomUUID();
  const carrier = createCookieCarrierResponse();

  try {
    assertSameOriginRequest(request);
    const profile = await requireApiAdmin({
      roles: ['owner'],
      response: carrier,
    });
    const { id } = await context.params;
    const testimonialId = parseUuidRouteParam(id);
    const body = await readBoundedJsonBody(
      request,
      ADMIN_CATALOG_LIMITS.MAX_BODY_BYTES,
    );
    const testimonial = await archiveAdminTestimonial(
      profile,
      testimonialId,
      body,
      {
        response: carrier,
        signal: request.signal,
      },
    );
    revalidatePublicContentPaths();

    return createAuthJsonSuccess(
      { testimonial },
      adminTestimonialMutationResponseSchema,
      requestId,
      carrier,
    );
  } catch (err) {
    return createAuthJsonError(err, requestId, carrier);
  }
}
