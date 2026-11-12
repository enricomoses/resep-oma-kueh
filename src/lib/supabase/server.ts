import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';

import { getSupabaseEnvironment } from '@/config/environment.client';

import { noStoreFetch } from './no-store-fetch';

export async function createServerAuthClient(response?: NextResponse) {
  const { url, publishableKey } = getSupabaseEnvironment();
  response?.headers.set('Cache-Control', 'private, no-store');
  const cookieStore = await cookies();
  return createServerClient(url, publishableKey, {
    global: { fetch: noStoreFetch },
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet, headers) => {
        // Without a response this is explicitly a read-only RSC adapter.
        // Proxy performs refresh; Route Handlers must pass their response.
        if (!response) return;
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
          response.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([name, value]) =>
          response.headers.set(name, value),
        );
      },
    },
  });
}
