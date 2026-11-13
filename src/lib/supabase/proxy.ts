import 'server-only';

import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { getSupabaseEnvironment } from '@/config/environment.client';
import { EnvironmentConfigurationError } from '@/config/parse-environment';
import type { Database } from '@/types/database';

import { noStoreFetch } from './no-store-fetch';

export async function refreshAuthSession(request: NextRequest) {
  let url: string;
  let publishableKey: string;
  try {
    ({ url, publishableKey } = getSupabaseEnvironment());
  } catch (error) {
    if (error instanceof EnvironmentConfigurationError) {
      const response = NextResponse.next({ request });
      response.headers.set('Cache-Control', 'private, no-store');
      return response;
    }
    throw error;
  }
  const pendingCookies = new Map<
    string,
    { name: string; value: string; options: CookieOptions }
  >();
  const pendingHeaders = new Headers({ 'Cache-Control': 'private, no-store' });
  const client = createServerClient<Database>(url, publishableKey, {
    global: { fetch: noStoreFetch },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        cookiesToSet.forEach((cookie) => {
          request.cookies.set(cookie.name, cookie.value);
          pendingCookies.set(cookie.name, cookie);
        });
        Object.entries(headers).forEach(([name, value]) =>
          pendingHeaders.set(name, value),
        );
      },
    },
  });
  // Refresh only. Authorization/profile revocation checks remain in F15 handlers.
  await client.auth.getClaims();
  const response = NextResponse.next({ request });
  pendingCookies.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options),
  );
  pendingHeaders.forEach((value, name) => response.headers.set(name, value));
  return response;
}
