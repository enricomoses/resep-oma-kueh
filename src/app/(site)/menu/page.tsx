import type { Metadata } from 'next';
import { connection } from 'next/server';
import { MenuView } from '@/components/catalog/menu-view';
import {
  CATALOG_AVAILABILITY,
  CATALOG_COPY,
  CATALOG_LIMITS,
  CATALOG_QUERY_PARAMS,
  CATALOG_SORTS,
  serializeCatalogQueryKey,
} from '@/constants/catalog.constant';
import { getCatalog, getCategories } from '@/features/catalog/service.server';
import type { CatalogQueryInput } from '@/types/catalog';

export const metadata: Metadata = {
  title: 'Menu & Katalog | Resep Oma Kueh',
  description: CATALOG_COPY.SUBTITLE,
};

function firstParam(value: string | string[] | undefined): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
}

function parseEnum<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
): T | undefined {
  if (!value) return undefined;
  return allowed.includes(value as T) ? (value as T) : undefined;
}

function parsePositiveInt(
  value: string | undefined,
  fallback: number,
  max: number,
): number {
  if (!value || !/^\d+$/.test(value)) return fallback;
  const num = Number(value);
  if (!Number.isSafeInteger(num) || num < 1 || num > max) return fallback;
  return num;
}

function parsePriceInt(value: string | undefined): number | undefined {
  if (!value || !/^\d+$/.test(value)) return undefined;
  const num = Number(value);
  if (
    !Number.isSafeInteger(num) ||
    num < 0 ||
    num > CATALOG_LIMITS.MAX_UNIT_IDR
  ) {
    return undefined;
  }
  return num;
}

export default async function MenuPage({ searchParams }: PageProps<'/menu'>) {
  await connection();
  const resolvedParams = await searchParams;

  const branch = firstParam(resolvedParams[CATALOG_QUERY_PARAMS.BRANCH]);
  const category = firstParam(resolvedParams[CATALOG_QUERY_PARAMS.CATEGORY]);
  const qRaw = firstParam(resolvedParams[CATALOG_QUERY_PARAMS.Q]);
  const q =
    qRaw && qRaw.length <= CATALOG_LIMITS.MAX_SEARCH_LENGTH ? qRaw : undefined;
  const tag = firstParam(resolvedParams[CATALOG_QUERY_PARAMS.TAG]);
  const availability = branch
    ? parseEnum(
        firstParam(resolvedParams[CATALOG_QUERY_PARAMS.AVAILABILITY]),
        CATALOG_AVAILABILITY,
      )
    : undefined;
  const minRaw = branch
    ? parsePriceInt(firstParam(resolvedParams[CATALOG_QUERY_PARAMS.MIN_PRICE]))
    : undefined;
  const maxRaw = branch
    ? parsePriceInt(firstParam(resolvedParams[CATALOG_QUERY_PARAMS.MAX_PRICE]))
    : undefined;
  const minPriceIdr =
    minRaw !== undefined && maxRaw !== undefined && minRaw > maxRaw
      ? undefined
      : minRaw;
  const maxPriceIdr =
    minRaw !== undefined && maxRaw !== undefined && minRaw > maxRaw
      ? undefined
      : maxRaw;
  const sort =
    parseEnum(
      firstParam(resolvedParams[CATALOG_QUERY_PARAMS.SORT]),
      CATALOG_SORTS,
    ) ?? 'featured';
  const page = parsePositiveInt(
    firstParam(resolvedParams[CATALOG_QUERY_PARAMS.PAGE]),
    CATALOG_LIMITS.DEFAULT_PAGE,
    10_000,
  );
  const limit = parsePositiveInt(
    firstParam(resolvedParams[CATALOG_QUERY_PARAMS.LIMIT]),
    CATALOG_LIMITS.DEFAULT_LIMIT,
    CATALOG_LIMITS.MAX_LIMIT,
  );

  const initialQueryInput: CatalogQueryInput = {
    branch,
    category,
    q,
    tag,
    availability,
    minPriceIdr,
    maxPriceIdr,
    sort,
    page,
    limit,
  };

  const [initialCategories, initialCatalogResult] = await Promise.all([
    getCategories()
      .then((data) => ({ status: 'success' as const, data }))
      .catch(() => ({ status: 'error' as const })),
    getCatalog(initialQueryInput)
      .then((data) => ({ status: 'success' as const, data }))
      .catch(() => ({ status: 'error' as const })),
  ]);

  return (
    <MenuView
      initialCategories={initialCategories}
      initialCatalog={{
        key: serializeCatalogQueryKey(initialQueryInput),
        result: initialCatalogResult,
      }}
    />
  );
}
