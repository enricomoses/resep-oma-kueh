import { NextResponse } from 'next/server';
import { ERROR_COPY } from '@/constants/copy.constant';
import { getPublicFaqs } from '@/features/content/service.server';
import { createSuccessResponse } from '@/lib/response.server';
import { apiErrorSchema } from '@/validations/api.schema';
import { publicFaqDirectorySchema } from '@/validations/content.schema';

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const params = new URL(request.url).searchParams;
  if ([...params.keys()].length > 0)
    return NextResponse.json(
      apiErrorSchema.parse({
        ok: false,
        error: { code: 'INVALID_REQUEST', message: ERROR_COPY.INVALID_REQUEST },
        requestId,
      }),
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  try {
    return createSuccessResponse(
      publicFaqDirectorySchema,
      await getPublicFaqs(request.signal),
      requestId,
    );
  } catch {
    return NextResponse.json(
      apiErrorSchema.parse({
        ok: false,
        error: { code: 'UPSTREAM_ERROR', message: ERROR_COPY.UPSTREAM_ERROR },
        requestId,
      }),
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
