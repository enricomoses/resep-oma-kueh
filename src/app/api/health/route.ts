import { NextResponse } from 'next/server';

import { ERROR_COPY } from '@/constants/copy.constant';
import { checkRuntimeHealth } from '@/features/health/service.server';
import { apiErrorSchema, apiSuccessSchema } from '@/validations/api.schema';
import { healthStatusSchema } from '@/validations/health.schema';

const HEALTH_RESPONSE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, private',
  Pragma: 'no-cache',
  Expires: '0',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow',
} as const;

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();

  try {
    const status = await checkRuntimeHealth(request.signal);
    const envelope = apiSuccessSchema(healthStatusSchema).parse({
      ok: true,
      data: status,
      requestId,
    });
    return NextResponse.json(envelope, {
      status: 200,
      headers: HEALTH_RESPONSE_HEADERS,
    });
  } catch {
    const errorPayload = apiErrorSchema.parse({
      ok: false,
      error: {
        code: 'UPSTREAM_ERROR',
        message: ERROR_COPY.UPSTREAM_ERROR,
      },
      requestId,
    });
    return NextResponse.json(errorPayload, {
      status: 503,
      headers: HEALTH_RESPONSE_HEADERS,
    });
  }
}
