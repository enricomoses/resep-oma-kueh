import { ADMIN_CATALOG_LIMITS } from '@/constants/admin-catalog.constant';

/**
 * Normalizes human-entered names into deterministic URL-safe slugs without touching DB state.
 */
export function slugifyCatalogName(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, ADMIN_CATALOG_LIMITS.SLUG_MAX);
}

/**
 * Walks parent references upward to reject self-parenting and ancestor cycles before saving.
 */
export function wouldCreateCategoryCycle(
  categoryId: string,
  candidateParentId: string | null,
  categories: ReadonlyArray<{ id: string; parentId: string | null }>,
): boolean {
  if (!candidateParentId) return false;
  if (candidateParentId === categoryId) return true;

  const byId = new Map<string, string | null>();
  for (const item of categories) {
    byId.set(item.id, item.parentId);
  }

  const visited = new Set<string>([categoryId]);
  let cursor: string | null = candidateParentId;

  while (cursor) {
    if (visited.has(cursor)) {
      return true;
    }
    visited.add(cursor);
    cursor = byId.get(cursor) ?? null;
  }

  return false;
}

/**
 * Checks whether a category still has non-archived child categories referencing it.
 */
export function hasActiveCategoryChildren(
  categoryId: string,
  categories: ReadonlyArray<{
    id: string;
    parentId: string | null;
    status: string;
  }>,
): boolean {
  return categories.some(
    (item) =>
      item.parentId === categoryId &&
      item.id !== categoryId &&
      item.status !== 'archived',
  );
}

/**
 * Clamps pagination back cleanly after archiving or removing the last row on page > 1.
 */
export function clampAdminPageAfterRemoval(
  currentPage: number,
  remainingItemsOnPage: number,
  totalAfterRemoval: number,
  limit: number,
): number {
  const safeLimit = Math.max(1, limit);
  const maxPage = Math.max(1, Math.ceil(totalAfterRemoval / safeLimit));
  if (remainingItemsOnPage <= 0 && currentPage > 1) {
    return Math.min(currentPage - 1, maxPage);
  }
  return Math.min(Math.max(1, currentPage), maxPage);
}

/**
 * Escapes LIKE wildcard characters so literal search queries never mutate PostgREST patterns.
 */
export function escapeLiteralSearchPattern(query: string): string {
  return query.replace(/[\\%_]/g, (match) => `\\${match}`);
}
