import { NextResponse } from 'next/server';

import { CLASSES_COPY, CLASSES_LIMITS } from '@/constants/classes.constant';
import { ERROR_COPY } from '@/constants/copy.constant';
import { PublicClassError } from '@/features/classes/errors.server';
import { prepareClassRegistration } from '@/features/classes/service.server';
import { logServerEvent } from '@/lib/logger.server';
import { readBoundedUtf8Body } from '@/lib/request-body.server';
import { apiErrorSchema } from '@/validations/api.schema';
import {
  prepareClassRegistrationRequestSchema,
  prepareClassRegistrationResponseSchema,
} from '@/validations/classes.schema';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();

  const bounded = await readBoundedUtf8Body(
    request,
    CLASSES_LIMITS.MAX_REQUEST_BYTES,
  );
  if (!bounded.ok) {
    const isTooLarge = bounded.reason === 'too_large';
    const status = isTooLarge ? 413 : 400;
    const code = isTooLarge ? 'REQUEST_TOO_LARGE' : 'INVALID_REQUEST';
    logServerEvent({
      requestId,
      route: '/api/classes/prepare-registration',
      operation: 'prepare_registration',
      status,
      durationMs: Date.now() - startedAt,
      errorCode: code,
    });
    return NextResponse.json(
      apiErrorSchema.parse({
        ok: false,
        error: {
          code,
          message: isTooLarge
            ? CLASSES_COPY.WA_ERRORS.TOO_LARGE
            : CLASSES_COPY.WA_ERRORS.INVALID_REQUEST,
        },
        requestId,
      }),
      { status, headers: NO_STORE_HEADERS },
    );
  }

  let rawBody: unknown;
  try {
    rawBody = JSON.parse(bounded.text);
  } catch {
    logServerEvent({
      requestId,
      route: '/api/classes/prepare-registration',
      operation: 'prepare_registration',
      status: 400,
      durationMs: Date.now() - startedAt,
      errorCode: 'INVALID_REQUEST',
    });
    return NextResponse.json(
      apiErrorSchema.parse({
        ok: false,
        error: {
          code: 'INVALID_REQUEST',
          message: CLASSES_COPY.WA_ERRORS.INVALID_REQUEST,
        },
        requestId,
      }),
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const parsed = prepareClassRegistrationRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.') || 'root';
      if (!fieldErrors[key]) {
        fieldErrors[key] = [];
      }
      fieldErrors[key].push(issue.message);
    }

    logServerEvent({
      requestId,
      route: '/api/classes/prepare-registration',
      operation: 'prepare_registration',
      status: 422,
      durationMs: Date.now() - startedAt,
      errorCode: 'VALIDATION_ERROR',
    });
    return NextResponse.json(
      apiErrorSchema.parse({
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: CLASSES_COPY.WA_ERRORS.VALIDATION_ERROR,
          fieldErrors,
        },
        requestId,
      }),
      { status: 422, headers: NO_STORE_HEADERS },
    );
  }

  try {
    const data = await prepareClassRegistration(parsed.data, request.signal);
    const payload = prepareClassRegistrationResponseSchema.parse({
      ok: true,
      data,
      requestId,
    });
    logServerEvent({
      requestId,
      route: '/api/classes/prepare-registration',
      operation: 'prepare_registration',
      status: 200,
      durationMs: Date.now() - startedAt,
      branchId: data.branchId,
      branchCode: data.branchCode,
      count: data.attendeeCount,
    });
    return NextResponse.json(payload, {
      status: 200,
      headers: NO_STORE_HEADERS,
    });
  } catch (err) {
    if (err instanceof PublicClassError) {
      logServerEvent({
        requestId,
        route: '/api/classes/prepare-registration',
        operation: 'prepare_registration',
        status: err.statusCode,
        durationMs: Date.now() - startedAt,
        errorCode: err.apiCode,
      });
      return NextResponse.json(
        apiErrorSchema.parse({
          ok: false,
          error: {
            code: err.apiCode,
            message: err.message,
            fieldErrors: err.fieldErrors,
          },
          requestId,
        }),
        { status: err.statusCode, headers: NO_STORE_HEADERS },
      );
    }

    logServerEvent({
      requestId,
      route: '/api/classes/prepare-registration',
      operation: 'prepare_registration',
      status: 503,
      durationMs: Date.now() - startedAt,
      errorCode: 'UPSTREAM_ERROR',
    });
    return NextResponse.json(
      apiErrorSchema.parse({
        ok: false,
        error: {
          code: 'UPSTREAM_ERROR',
          message: ERROR_COPY.UPSTREAM_ERROR,
        },
        requestId,
      }),
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }
}
