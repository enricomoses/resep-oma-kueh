import 'server-only';

import { z } from 'zod';

import { getPublicEnvironment } from '@/config/environment.client';
import {
  EnvironmentConfigurationError,
  parseEnvironment,
} from '@/config/parse-environment';
import { booleanEnvironmentSchema } from '@/validations/env.schema';

const emptyToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const positiveIntEnvSchema = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int().positive().max(1_000_000).optional(),
);

const limiterUrlSchema = z.preprocess(
  emptyToUndefined,
  z
    .url()
    .refine((value) => {
      try {
        const parsed = new URL(value);
        if (parsed.username || parsed.password) return false;
        return (
          parsed.protocol === 'https:' ||
          (parsed.protocol === 'http:' &&
            ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname))
        );
      } catch {
        return false;
      }
    })
    .optional(),
);

export const serverEnvironmentSchema = z
  .strictObject({
    APP_ENV: z
      .enum(['development', 'test', 'staging', 'production'])
      .default('development'),
    CHAT_PROVIDER_ENABLED: booleanEnvironmentSchema.default(false),
    GOOGLE_GEN_AI_API_KEY: z.preprocess(
      emptyToUndefined,
      z.string().trim().min(10).optional(),
    ),
    GOOGLE_GEN_AI_CHAT_MODEL: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .trim()
        .regex(/^[a-z0-9][a-z0-9._-]{2,80}$/i)
        .optional(),
    ),
    CHAT_GENERATIVE_QUOTA_PER_DAY: positiveIntEnvSchema,
    CHAT_GENERATIVE_RPM_LIMIT: positiveIntEnvSchema,
    CHAT_GENERATIVE_GLOBAL_RPM_LIMIT: positiveIntEnvSchema,
    CHAT_GENERATIVE_MAX_CONCURRENCY: positiveIntEnvSchema,
    CHAT_LIMITER_STORE_URL: limiterUrlSchema,
    CHAT_LIMITER_STORE_TOKEN: z.preprocess(
      emptyToUndefined,
      z.string().trim().min(8).optional(),
    ),
    CHAT_LIMITER_HASH_SALT: z.preprocess(
      emptyToUndefined,
      z.string().trim().min(8).optional(),
    ),
  })
  .superRefine((env, ctx) => {
    if (!env.CHAT_PROVIDER_ENABLED) {
      return;
    }

    const requiredWhenEnabled: Array<keyof typeof env> = [
      'GOOGLE_GEN_AI_API_KEY',
      'GOOGLE_GEN_AI_CHAT_MODEL',
      'CHAT_GENERATIVE_QUOTA_PER_DAY',
      'CHAT_LIMITER_STORE_URL',
      'CHAT_LIMITER_STORE_TOKEN',
    ];

    for (const key of requiredWhenEnabled) {
      if (env[key] === undefined) {
        ctx.addIssue({
          code: 'custom',
          path: [key],
          message: 'Required when CHAT_PROVIDER_ENABLED is true',
        });
      }
    }

    if (env.APP_ENV === 'production' && env.CHAT_LIMITER_STORE_URL) {
      try {
        const parsed = new URL(env.CHAT_LIMITER_STORE_URL);
        if (parsed.protocol !== 'https:') {
          ctx.addIssue({
            code: 'custom',
            path: ['CHAT_LIMITER_STORE_URL'],
            message: 'Production limiter store URL must use HTTPS',
          });
        }
      } catch {
        ctx.addIssue({
          code: 'custom',
          path: ['CHAT_LIMITER_STORE_URL'],
          message: 'Invalid limiter store URL',
        });
      }
    }
  });

export function getServerEnvironment() {
  const environment = parseEnvironment(serverEnvironmentSchema, {
    APP_ENV: process.env.APP_ENV,
    CHAT_PROVIDER_ENABLED: process.env.CHAT_PROVIDER_ENABLED,
    GOOGLE_GEN_AI_API_KEY: process.env.GOOGLE_GEN_AI_API_KEY,
    GOOGLE_GEN_AI_CHAT_MODEL: process.env.GOOGLE_GEN_AI_CHAT_MODEL,
    CHAT_GENERATIVE_QUOTA_PER_DAY: process.env.CHAT_GENERATIVE_QUOTA_PER_DAY,
    CHAT_GENERATIVE_RPM_LIMIT: process.env.CHAT_GENERATIVE_RPM_LIMIT,
    CHAT_GENERATIVE_GLOBAL_RPM_LIMIT:
      process.env.CHAT_GENERATIVE_GLOBAL_RPM_LIMIT,
    CHAT_GENERATIVE_MAX_CONCURRENCY:
      process.env.CHAT_GENERATIVE_MAX_CONCURRENCY,
    CHAT_LIMITER_STORE_URL: process.env.CHAT_LIMITER_STORE_URL,
    CHAT_LIMITER_STORE_TOKEN: process.env.CHAT_LIMITER_STORE_TOKEN,
    CHAT_LIMITER_HASH_SALT: process.env.CHAT_LIMITER_HASH_SALT,
  });
  // Production must explicitly leave demo mode; release data audit is separate.
  if (
    environment.APP_ENV === 'production' &&
    getPublicEnvironment().NEXT_PUBLIC_DEMO_MODE
  ) {
    throw new EnvironmentConfigurationError(['NEXT_PUBLIC_DEMO_MODE']);
  }
  return environment;
}
