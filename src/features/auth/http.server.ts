import 'server-only';

import { NextResponse } from 'next/server';
import type { z } from 'zod';

import { ERROR_COPY } from '@/constants/copy.constant';
import { apiErrorSchema, apiSuccessSchema } from '@/validations/api.schema';

import {
  AuthError,
  AuthInvalidRequestError,
  AuthRequestTooLargeError,
  AuthValidationError,
} from './errors.server';

const PRIVATE_NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
  'Referrer-Policy': 'no-referrer',
} as const;

export function createCookieCarrierResponse(): NextResponse {
  return new NextResponse(null, { headers: PRIVATE_NO_STORE_HEADERS });
}

export function applyAuthResponseMetadata(
  carrier: NextResponse,
  target: NextResponse,
): NextResponse {
  for (const cookie of carrier.cookies.getAll()) {
    target.cookies.set(cookie);
  }
  carrier.headers.forEach((value, name) => {
    target.headers.set(name, value);
  });
  Object.entries(PRIVATE_NO_STORE_HEADERS).forEach(([name, value]) => {
    target.headers.set(name, value);
  });
  return target;
}

export function createAuthJsonSuccess<T>(
  data: T,
  dataSchema: z.ZodType<T>,
  requestId: string,
  carrier?: NextResponse,
  status: number = 200,
): NextResponse {
  const envelope = apiSuccessSchema(dataSchema).parse({
    ok: true,
    data,
    requestId,
  });
  const response = NextResponse.json(envelope, {
    status,
    headers: PRIVATE_NO_STORE_HEADERS,
  });
  return carrier ? applyAuthResponseMetadata(carrier, response) : response;
}

export function createAuthJsonError(
  err: unknown,
  requestId: string,
  carrier?: NextResponse,
): NextResponse {
  const isKnown = err instanceof AuthError;
  const code = isKnown ? err.code : 'INTERNAL_ERROR';
  const status = isKnown ? err.status : 500;
  const message = isKnown ? err.message : ERROR_COPY.INTERNAL_ERROR;

  const headers: Record<string, string> = { ...PRIVATE_NO_STORE_HEADERS };
  if (isKnown && err.retryAfterSeconds) {
    headers['Retry-After'] = String(err.retryAfterSeconds);
  }

  const envelope = apiErrorSchema.parse({
    ok: false,
    error: {
      code,
      message,
      ...(isKnown && err.fieldErrors ? { fieldErrors: err.fieldErrors } : {}),
    },
    requestId,
  });

  const response = NextResponse.json(envelope, { status, headers });
  return carrier ? applyAuthResponseMetadata(carrier, response) : response;
}

export function parseWithSchema<T>(schema: z.ZodType<T>, raw: unknown): T {
  const parsed = schema.safeParse(raw);
  if (parsed.success) return parsed.data;

  const fieldErrors: Record<string, string[]> = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path.join('.') || 'root';
    if (!fieldErrors[key]) {
      fieldErrors[key] = [];
    }
    fieldErrors[key].push(issue.message);
  }
  throw new AuthValidationError(ERROR_COPY.VALIDATION_ERROR, fieldErrors);
}

export async function readBoundedJsonBody(
  request: Request,
  maxBytes: number,
): Promise<unknown> {
  const contentLength = request.headers.get('content-length');
  if (contentLength && Number.parseInt(contentLength, 10) > maxBytes) {
    throw new AuthRequestTooLargeError();
  }

  let buffer: ArrayBuffer;
  try {
    buffer = await request.arrayBuffer();
  } catch {
    throw new AuthInvalidRequestError();
  }

  if (buffer.byteLength > maxBytes) {
    throw new AuthRequestTooLargeError();
  }

  try {
    const text = new TextDecoder('utf-8').decode(buffer);
    return JSON.parse(text);
  } catch {
    throw new AuthInvalidRequestError();
  }
}
