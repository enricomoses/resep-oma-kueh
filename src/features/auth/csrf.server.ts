import 'server-only';

import { getPublicEnvironment } from '@/config/environment.client';
import { AUTH_COPY } from '@/constants/auth.constant';

import { AuthForbiddenError } from './errors.server';

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]']);

function parseOrigin(rawUrl: string | null): string | null {
  if (!rawUrl || rawUrl === 'null') return null;
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}

function resolveExpectedRequestOrigin(request: Request): string {
  const rawUrl = new URL(request.url);
  const forwardedHost = request.headers
    .get('x-forwarded-host')
    ?.split(',')[0]
    ?.trim();
  const host = forwardedHost || request.headers.get('host')?.trim();
  const forwardedProto = request.headers
    .get('x-forwarded-proto')
    ?.split(',')[0]
    ?.trim();
  const protocol =
    forwardedProto === 'http' || forwardedProto === 'https'
      ? `${forwardedProto}:`
      : rawUrl.protocol;

  if (host) {
    try {
      return new URL(`${protocol}//${host}`).origin;
    } catch {
      return rawUrl.origin;
    }
  }
  return rawUrl.origin;
}

/**
 * Enforces same-origin requests on cookie-authenticated or session-establishing
 * auth mutations (`POST /api/auth/*`). Rejects cross-site Fetch metadata,
 * `Origin: null`, missing `Origin`/`Referer`, and mismatched origins.
 */
export function assertSameOriginRequest(request: Request): void {
  const secFetchSite = request.headers.get('sec-fetch-site')?.trim();
  if (secFetchSite === 'cross-site') {
    throw new AuthForbiddenError(AUTH_COPY.ERROR_CSRF_FORBIDDEN);
  }

  const expectedOrigin = resolveExpectedRequestOrigin(request);
  const originHeader = request.headers.get('origin');
  if (originHeader !== null) {
    const parsedOrigin = parseOrigin(originHeader.trim());
    if (!parsedOrigin || parsedOrigin !== expectedOrigin) {
      throw new AuthForbiddenError(AUTH_COPY.ERROR_CSRF_FORBIDDEN);
    }
    return;
  }

  const refererHeader = request.headers.get('referer');
  if (refererHeader !== null) {
    const parsedReferer = parseOrigin(refererHeader.trim());
    if (!parsedReferer || parsedReferer !== expectedOrigin) {
      throw new AuthForbiddenError(AUTH_COPY.ERROR_CSRF_FORBIDDEN);
    }
    return;
  }

  throw new AuthForbiddenError(AUTH_COPY.ERROR_CSRF_FORBIDDEN);
}

/**
 * Resolves a trusted origin for building Supabase email recovery callback URLs.
 * Uses the request origin for local loopback hosts and verified site origin otherwise.
 */
export function resolveTrustedRedirectOrigin(request: Request): string {
  const configuredOrigin = new URL(getPublicEnvironment().NEXT_PUBLIC_SITE_URL)
    .origin;
  const requestOrigin = resolveExpectedRequestOrigin(request);

  try {
    const parsed = new URL(requestOrigin);
    if (LOCAL_HOSTNAMES.has(parsed.hostname)) {
      return requestOrigin;
    }
    if (requestOrigin === configuredOrigin) {
      return requestOrigin;
    }
  } catch {
    return configuredOrigin;
  }

  return configuredOrigin;
}
