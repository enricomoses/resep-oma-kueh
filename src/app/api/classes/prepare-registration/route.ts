import { NextResponse } from 'next/server';

import { CLASSES_COPY, CLASSES_LIMITS } from '@/constants/classes.constant';
import { ERROR_COPY } from '@/constants/copy.constant';
import { PublicClassError } from '@/features/classes/errors.server';
import { prepareClassRegistration } from '@/features/classes/service.server';
import { apiErrorSchema } from '@/validations/api.schema';
import {
  prepareClassRegistrationRequestSchema,
  prepareClassRegistrationResponseSchema,
} from '@/validations/classes.schema';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  const contentLength = request.headers.get('content-length');
  if (
    contentLength &&
    Number.parseInt(contentLength, 10) > CLASSES_LIMITS.MAX_REQUEST_BYTES
  ) {
    return NextResponse.json(
      apiErrorSchema.parse({
        ok: false,
        error: {
          code: 'REQUEST_TOO_LARGE',
          message: CLASSES_COPY.WA_ERRORS.TOO_LARGE,
        },
        requestId,
      }),
      { status: 413, headers: NO_STORE_HEADERS },
    );
  }

  let arrayBuffer: ArrayBuffer;
  try {
    arrayBuffer = await request.arrayBuffer();
  } catch {
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

  if (arrayBuffer.byteLength > CLASSES_LIMITS.MAX_REQUEST_BYTES) {
    return NextResponse.json(
      apiErrorSchema.parse({
        ok: false,
        error: {
          code: 'REQUEST_TOO_LARGE',
          message: CLASSES_COPY.WA_ERRORS.TOO_LARGE,
        },
        requestId,
      }),
      { status: 413, headers: NO_STORE_HEADERS },
    );
  }

  let rawBody: unknown;
  try {
    rawBody = JSON.parse(new TextDecoder('utf-8').decode(arrayBuffer));
  } catch {
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
    return NextResponse.json(payload, {
      status: 200,
      headers: NO_STORE_HEADERS,
    });
  } catch (err) {
    if (err instanceof PublicClassError) {
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
