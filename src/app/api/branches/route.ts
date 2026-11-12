import { NextResponse } from 'next/server';
import { getBranches } from '@/features/branches/service.server';
import { createSuccessResponse } from '@/lib/response.server';
import {
  branchDirectorySchema,
  branchQuerySchema,
} from '@/validations/branch.schema';
import { ERROR_COPY } from '@/constants/copy.constant';
import { apiErrorSchema } from '@/validations/api.schema';

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const params = new URL(request.url).searchParams;
  const parsed = branchQuerySchema.safeParse(Object.fromEntries(params));
  if (!parsed.success || params.getAll('branch').length > 1)
    return NextResponse.json(
      {
        ok: false,
        error: { code: 'INVALID_REQUEST', message: ERROR_COPY.INVALID_REQUEST },
        requestId,
      },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  try {
    return createSuccessResponse(
      branchDirectorySchema,
      await getBranches(parsed.data, request.signal),
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
