import { NextResponse } from 'next/server';
import { z } from 'zod';

import { CATALOG_QUERY_PARAMS } from '@/constants/catalog.constant';
import { ERROR_COPY } from '@/constants/copy.constant';
import { PublicClassError } from '@/features/classes/errors.server';
import { getPublicClassDetail } from '@/features/classes/service.server';
import { apiErrorSchema } from '@/validations/api.schema';
import {
  publicClassDetailResponseSchema,
  publicClassQuerySchema,
} from '@/validations/classes.schema';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

const slugParamSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(120);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const requestId = crypto.randomUUID();
  const { slug: rawSlug } = await params;
  const searchParams = new URL(request.url).searchParams;

  for (const key of searchParams.keys()) {
    if (
      key !== CATALOG_QUERY_PARAMS.BRANCH ||
      searchParams.getAll(key).length > 1
    ) {
      return NextResponse.json(
        apiErrorSchema.parse({
          ok: false,
          error: {
            code: 'INVALID_REQUEST',
            message: ERROR_COPY.INVALID_REQUEST,
          },
          requestId,
        }),
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }
  }

  const parsedSlug = slugParamSchema.safeParse(rawSlug);
  const branchRaw = searchParams.get(CATALOG_QUERY_PARAMS.BRANCH);
  const parsedQuery = publicClassQuerySchema.safeParse({
    branch:
      branchRaw && branchRaw.trim().length > 0 ? branchRaw.trim() : undefined,
  });

  if (!parsedSlug.success || !parsedQuery.success) {
    return NextResponse.json(
      apiErrorSchema.parse({
        ok: false,
        error: {
          code: 'INVALID_REQUEST',
          message: ERROR_COPY.INVALID_REQUEST,
        },
        requestId,
      }),
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  try {
    const data = await getPublicClassDetail(
      parsedSlug.data,
      parsedQuery.data,
      request.signal,
    );
    const payload = publicClassDetailResponseSchema.parse({
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
