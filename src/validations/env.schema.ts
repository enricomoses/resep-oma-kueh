import { z } from 'zod';

import { APP } from '@/constants/app.constant';

const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);
export const booleanEnvironmentSchema = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

const httpUrlSchema = z.url().refine((value) => {
  try {
    const url = new URL(value);
    return (
      !url.username &&
      !url.password &&
      (url.protocol === 'https:' ||
        (url.protocol === 'http:' &&
          ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)))
    );
  } catch {
    return false;
  }
});

const publishableKeySchema = z.string().refine((value) => {
  if (/^sb_publishable_[A-Za-z0-9_-]{10,}$/.test(value)) return true;
  try {
    const parts = value.split('.');
    if (parts.length !== 3) return false;
    const payload: unknown = JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')),
    );
    return z.object({ role: z.literal('anon') }).safeParse(payload).success;
  } catch {
    return false;
  }
});

export const publicEnvironmentSchema = z.strictObject({
  NEXT_PUBLIC_SITE_URL: z.preprocess(
    emptyToUndefined,
    httpUrlSchema.default(APP.LOCAL_SITE_URL),
  ),
  NEXT_PUBLIC_CHAT_WIDGET_ENABLED: z.preprocess(
    emptyToUndefined,
    booleanEnvironmentSchema.default(true),
  ),
  NEXT_PUBLIC_SUPABASE_URL: z.preprocess(
    emptyToUndefined,
    httpUrlSchema.optional(),
  ),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.preprocess(
    emptyToUndefined,
    publishableKeySchema.optional(),
  ),
});

export const supabaseEnvironmentSchema = z.strictObject({
  url: httpUrlSchema,
  publishableKey: publishableKeySchema,
});
