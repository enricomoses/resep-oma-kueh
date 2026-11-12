export const QUERY_KEYS = {
  ROOT: ['resep-oma-kueh'],
  BRANCHES: (code: string | null) =>
    ['resep-oma-kueh', 'branches', code] as const,
  CATEGORIES: ['resep-oma-kueh', 'categories'] as const,
  CATALOG: (params: Record<string, string | number | null | undefined>) =>
    ['resep-oma-kueh', 'catalog', params] as const,
  CONTENT: (keys: readonly string[]) =>
    ['resep-oma-kueh', 'content', ...keys] as const,
  FAQS: ['resep-oma-kueh', 'faqs'] as const,
} as const;

export const STALE_TIME = { PUBLIC: 60_000 } as const;

export const QUERY_LIMITS = { RETRIES: 1, GC_TIME_MS: 300_000 } as const;
