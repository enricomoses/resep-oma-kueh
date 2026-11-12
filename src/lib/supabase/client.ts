'use client';

import { createBrowserClient } from '@supabase/ssr';

import { getSupabaseEnvironment } from '@/config/environment.client';

// Auth adapter only. Business reads/writes go through the BFF.
export function createBrowserAuthClient() {
  const { url, publishableKey } = getSupabaseEnvironment();
  return createBrowserClient(url, publishableKey);
}
