/**
 * Builds a compact query parameter object by removing empty, nullish,
 * and optional sentinel (`'all'`) values while preserving `0` and `false`.
 */
export function buildListParams<
  T extends Record<string, string | number | boolean | null | undefined>,
>(
  params?: T,
  options?: { omitAll?: boolean },
): Record<string, string | number | boolean> | undefined {
  if (!params) return undefined;

  const clean: Record<string, string | number | boolean> = {};
  const omitAll = options?.omitAll ?? false;

  for (const [key, rawValue] of Object.entries(params)) {
    if (rawValue === undefined || rawValue === null) continue;

    if (typeof rawValue === 'string') {
      const trimmed = rawValue.trim();
      if (!trimmed) continue;
      if (omitAll && trimmed === 'all') continue;
      clean[key] = trimmed;
      continue;
    }

    clean[key] = rawValue;
  }

  return Object.keys(clean).length > 0 ? clean : undefined;
}
