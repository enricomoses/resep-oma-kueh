import { NextResponse } from 'next/server';
import { CATALOG_QUERY_PARAMS } from '@/constants/catalog.constant';
import { ERROR_COPY } from '@/constants/copy.constant';
import { getProductDetail } from '@/features/catalog/service.server';
import { createSuccessResponse } from '@/lib/response.server';
import { apiErrorSchema } from '@/validations/api.schema';
import {
  productDetailQuerySchema,
  productDetailSchema,
} from '@/validations/catalog.schema';

const ALLOWED_PARAM_KEYS = new Set<string>([CATALOG_QUERY_PARAMS.BRANCH]);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const requestId = crypto.randomUUID();
  const { slug } = await params;
  const searchParams = new URL(request.url).searchParams;

  for (const key of searchParams.keys()) {
    if (!ALLOWED_PARAM_KEYS.has(key) || searchParams.getAll(key).length > 1) {
      return NextResponse.json(
        apiErrorSchema.parse({
          ok: false,
          error: {
            code: 'INVALID_REQUEST',
            message: ERROR_COPY.INVALID_REQUEST,
          },
          requestId,
        }),
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      );
    }
  }

  const branchRaw = searchParams.get(CATALOG_QUERY_PARAMS.BRANCH);
  const branch =
    branchRaw && branchRaw.trim().length > 0 ? branchRaw.trim() : undefined;

  const parsed = productDetailQuerySchema.safeParse({ slug, branch });
  if (!parsed.success) {
    return NextResponse.json(
      apiErrorSchema.parse({
        ok: false,
        error: { code: 'INVALID_REQUEST', message: ERROR_COPY.INVALID_REQUEST },
        requestId,
      }),
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  try {
    const product = await getProductDetail(parsed.data, {}, request.signal);
    if (!product) {
      return NextResponse.json(
        apiErrorSchema.parse({
          ok: false,
          error: { code: 'NOT_FOUND', message: ERROR_COPY.NOT_FOUND },
          requestId,
        }),
        { status: 404, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    return createSuccessResponse(productDetailSchema, product, requestId);
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
