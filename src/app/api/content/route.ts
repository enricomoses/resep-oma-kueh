import { NextResponse } from 'next/server';
import { ERROR_COPY } from '@/constants/copy.constant';
import { getPublicContent } from '@/features/content/service.server';
import { createSuccessResponse } from '@/lib/response.server';
import { apiErrorSchema } from '@/validations/api.schema';
import {
  contentQuerySchema,
  publicContentDirectorySchema,
} from '@/validations/content.schema';

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const params = new URL(request.url).searchParams;
  const parsed = contentQuerySchema.safeParse(Object.fromEntries(params));
  if (!parsed.success || params.getAll('keys').length > 1)
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
      publicContentDirectorySchema,
      await getPublicContent(
        parsed.data.keys ? { keys: parsed.data.keys.join(',') } : {},
        request.signal,
      ),
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
