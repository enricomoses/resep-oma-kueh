import {
  publicEnvironmentSchema,
  supabaseEnvironmentSchema,
} from '@/validations/env.schema';

import { parseEnvironment } from './parse-environment';

export function getPublicEnvironment() {
  // Explicit references are necessary for Next's browser build-time substitution.
  return parseEnvironment(publicEnvironmentSchema, {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_CHAT_WIDGET_ENABLED:
      process.env.NEXT_PUBLIC_CHAT_WIDGET_ENABLED,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}

export function getSupabaseEnvironment() {
  const environment = getPublicEnvironment();
  return parseEnvironment(supabaseEnvironmentSchema, {
    url: environment.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}
