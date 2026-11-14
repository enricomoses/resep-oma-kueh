import { NextResponse } from 'next/server';
import { getBranches } from '@/features/branches/service.server';
import { logServerEvent } from '@/lib/logger.server';
import { createSuccessResponse } from '@/lib/response.server';
import {
  branchDirectorySchema,
  branchQuerySchema,
} from '@/validations/branch.schema';
import { ERROR_COPY } from '@/constants/copy.constant';
import { apiErrorSchema } from '@/validations/api.schema';

export async function GET(request: Request) {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();
  const params = new URL(request.url).searchParams;
  const parsed = branchQuerySchema.safeParse(Object.fromEntries(params));
  if (!parsed.success || params.getAll('branch').length > 1) {
    logServerEvent({
      requestId,
      route: '/api/branches',
      operation: 'list_branches',
      status: 400,
      durationMs: Date.now() - startedAt,
      errorCode: 'INVALID_REQUEST',
    });
    return NextResponse.json(
      {
        ok: false,
        error: { code: 'INVALID_REQUEST', message: ERROR_COPY.INVALID_REQUEST },
        requestId,
      },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }
  try {
    const data = await getBranches(parsed.data, request.signal);
    logServerEvent({
      requestId,
      route: '/api/branches',
      operation: 'list_branches',
      status: 200,
      durationMs: Date.now() - startedAt,
      branchId: data.resolvedBranchId,
      count: data.items.length,
    });
    return createSuccessResponse(branchDirectorySchema, data, requestId);
  } catch {
    logServerEvent({
      requestId,
      route: '/api/branches',
      operation: 'list_branches',
      status: 503,
      durationMs: Date.now() - startedAt,
      errorCode: 'UPSTREAM_ERROR',
    });
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
