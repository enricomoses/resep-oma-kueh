import {
  CATALOG_AVAILABILITY,
  CATALOG_LIMITS,
  CATALOG_QUERY_PARAMS,
  CATALOG_SORTS,
} from '@/constants/catalog.constant';
import { BRANCH } from '@/constants/site.constant';
import type { CatalogQueryInput } from '@/types/catalog';

export function withBranch(href: string, code: string | null | undefined) {
  const [path, hash] = href.split('#');
  const [pathname, search] = path.split('?');
  const params = new URLSearchParams(search);
  if (code != null) params.set(BRANCH.PARAM, code);
  else params.delete(BRANCH.PARAM);
  return `${pathname}${params.size ? `?${params}` : ''}${hash ? `#${hash}` : ''}`;
}

export function firstSearchParam(
  value: string | string[] | null | undefined,
): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
}

export function parseCatalogEnumParam<T extends string>(
  value: string | string[] | null | undefined,
  allowed: readonly T[],
): T | undefined {
  const trimmed = firstSearchParam(value);
  if (!trimmed) return undefined;
  return allowed.includes(trimmed as T) ? (trimmed as T) : undefined;
}

export function parseCatalogPositiveIntParam(
  value: string | string[] | null | undefined,
  fallback: number,
  max: number,
): number {
  const trimmed = firstSearchParam(value);
  if (!trimmed || !/^\d+$/.test(trimmed)) return fallback;
  const num = Number(trimmed);
  if (!Number.isSafeInteger(num) || num < 1 || num > max) return fallback;
  return num;
}

export function parseCatalogPriceParam(
  value: string | string[] | null | undefined,
): number | undefined {
  const trimmed = firstSearchParam(value);
  if (!trimmed || !/^\d+$/.test(trimmed)) return undefined;
  const num = Number(trimmed);
  if (
    !Number.isSafeInteger(num) ||
    num < 0 ||
    num > CATALOG_LIMITS.MAX_UNIT_IDR
  ) {
    return undefined;
  }
  return num;
}

export function parseCatalogSearchParams(
  rawParams: Record<string, string | string[] | undefined>,
): CatalogQueryInput {
  const branch = firstSearchParam(rawParams[CATALOG_QUERY_PARAMS.BRANCH]);
  const category = firstSearchParam(rawParams[CATALOG_QUERY_PARAMS.CATEGORY]);
  const qRaw = firstSearchParam(rawParams[CATALOG_QUERY_PARAMS.Q]);
  const q =
    qRaw && qRaw.length <= CATALOG_LIMITS.MAX_SEARCH_LENGTH ? qRaw : undefined;
  const tag = firstSearchParam(rawParams[CATALOG_QUERY_PARAMS.TAG]);
  const availability = branch
    ? parseCatalogEnumParam(
        rawParams[CATALOG_QUERY_PARAMS.AVAILABILITY],
        CATALOG_AVAILABILITY,
      )
    : undefined;
  const minRaw = branch
    ? parseCatalogPriceParam(rawParams[CATALOG_QUERY_PARAMS.MIN_PRICE])
    : undefined;
  const maxRaw = branch
    ? parseCatalogPriceParam(rawParams[CATALOG_QUERY_PARAMS.MAX_PRICE])
    : undefined;
  const isInvalidRange =
    minRaw !== undefined && maxRaw !== undefined && minRaw > maxRaw;

  return {
    branch,
    category,
    q,
    tag,
    availability,
    minPriceIdr: isInvalidRange ? undefined : minRaw,
    maxPriceIdr: isInvalidRange ? undefined : maxRaw,
    sort:
      parseCatalogEnumParam(
        rawParams[CATALOG_QUERY_PARAMS.SORT],
        CATALOG_SORTS,
      ) ?? 'featured',
    page: parseCatalogPositiveIntParam(
      rawParams[CATALOG_QUERY_PARAMS.PAGE],
      CATALOG_LIMITS.DEFAULT_PAGE,
      10_000,
    ),
    limit: parseCatalogPositiveIntParam(
      rawParams[CATALOG_QUERY_PARAMS.LIMIT],
      CATALOG_LIMITS.DEFAULT_LIMIT,
      CATALOG_LIMITS.MAX_LIMIT,
    ),
  };
}
