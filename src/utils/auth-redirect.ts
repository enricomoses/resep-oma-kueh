import { ROUTES } from '@/constants/routes.constant';

const CONTROL_CHARS_RE = /[\x00-\x1f\x7f]/;

/**
 * Resolves a caller-provided `next` redirect parameter strictly against
 * internal admin routes (`/admin` or `/admin/...`). Rejects scheme-relative
 * URLs (`//evil.com`), backslashes, control characters, and external hosts.
 */
export function resolveSafeAdminRedirectPath(
  rawNext: string | null | undefined,
  fallback: string = ROUTES.ADMIN,
  options?: { allowLoginPath?: boolean },
): string {
  if (typeof rawNext !== 'string') return fallback;
  const trimmed = rawNext.trim();
  if (trimmed.length === 0) return fallback;
  if (!trimmed.startsWith('/')) return fallback;
  if (trimmed.startsWith('//')) return fallback;
  if (trimmed.includes('\\') || CONTROL_CHARS_RE.test(trimmed)) return fallback;

  let parsed: URL;
  try {
    parsed = new URL(trimmed, 'http://localhost');
  } catch {
    return fallback;
  }

  if (parsed.origin !== 'http://localhost') return fallback;
  if (parsed.username || parsed.password) return fallback;

  const isAdminRoute =
    parsed.pathname === ROUTES.ADMIN ||
    parsed.pathname.startsWith(`${ROUTES.ADMIN}/`);
  if (!isAdminRoute) return fallback;

  if (!options?.allowLoginPath && parsed.pathname === ROUTES.ADMIN_LOGIN) {
    return fallback;
  }

  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}
