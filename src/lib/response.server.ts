import 'server-only';

import { NextResponse } from 'next/server';
import type { z } from 'zod';

import { ERROR_COPY } from '@/constants/copy.constant';
import type { ApiError } from '@/types';
import { apiSuccessSchema } from '@/validations/api.schema';

export function createSuccessResponse<T>(
  schema: z.ZodType<T>,
  data: T,
  requestId: string = crypto.randomUUID(),
) {
  const envelope = apiSuccessSchema(schema).safeParse({
    ok: true,
    data,
    requestId,
  });
  if (!envelope.success) return createErrorResponse(requestId);
  return NextResponse.json(envelope.data, {
    headers: { 'Cache-Control': 'no-store' },
  });
}

export function createErrorResponse(requestId: string = crypto.randomUUID()) {
  // No raw Error/SQL/provider objects are accepted by this public response helper.
  const payload: ApiError = {
    ok: false,
    error: { code: 'INTERNAL_ERROR', message: ERROR_COPY.INTERNAL_ERROR },
    requestId,
  };
  return NextResponse.json(payload, {
    status: 500,
    headers: { 'Cache-Control': 'no-store' },
  });
}
