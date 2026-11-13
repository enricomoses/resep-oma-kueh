import 'server-only';

import { createClient } from '@supabase/supabase-js';

import { getSupabaseEnvironment } from '@/config/environment.client';
import type { Database } from '@/types/database';

function createAnonymousSupabaseClient() {
  const { url, publishableKey } = getSupabaseEnvironment();
  return createClient<Database>(url, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(
          input instanceof Request ? input.headers : undefined,
        );
        new Headers(init?.headers).forEach((value, name) =>
          headers.set(name, value),
        );
        headers.delete('cookie');
        headers.set('apikey', publishableKey);
        headers.set('Authorization', `Bearer ${publishableKey}`);
        return fetch(input, {
          ...init,
          headers,
          credentials: 'omit',
          cache: 'no-store',
        });
      },
    },
  });
}

export function createPublicReadClient() {
  return createAnonymousSupabaseClient();
}

/**
 * Dedicated anonymous SELECT-only Supabase client for Ask Oma retrieval.
 * Intentionally separate from SSR cookie/admin auth context.
 */
export function createChatReadClient() {
  return createAnonymousSupabaseClient();
}
