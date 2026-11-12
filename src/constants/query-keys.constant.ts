export const QUERY_KEYS = {
  ROOT: ['resep-oma-kueh'],
  BRANCHES: (code: string | null) =>
    ['resep-oma-kueh', 'branches', code] as const,
} as const;

export const STALE_TIME = { PUBLIC: 60_000 } as const;

export const QUERY_LIMITS = { RETRIES: 1, GC_TIME_MS: 300_000 } as const;
