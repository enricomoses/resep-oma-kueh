import 'server-only';

import { z } from 'zod';

import { booleanEnvironmentSchema } from '@/validations/env.schema';

import { parseEnvironment } from './parse-environment';

export const serverEnvironmentSchema = z.strictObject({
  APP_ENV: z
    .enum(['development', 'test', 'staging', 'production'])
    .default('development'),
  // F23 has not been selected. Fail closed if someone enables it prematurely.
  CHAT_PROVIDER_ENABLED: booleanEnvironmentSchema
    .default(false)
    .refine((value) => !value),
  GOOGLE_GEN_AI_API_KEY: z.string().optional(),
  GOOGLE_GEN_AI_CHAT_MODEL: z.string().optional(),
});

export function getServerEnvironment() {
  return parseEnvironment(serverEnvironmentSchema, {
    APP_ENV: process.env.APP_ENV,
    CHAT_PROVIDER_ENABLED: process.env.CHAT_PROVIDER_ENABLED,
    GOOGLE_GEN_AI_API_KEY: process.env.GOOGLE_GEN_AI_API_KEY,
    GOOGLE_GEN_AI_CHAT_MODEL: process.env.GOOGLE_GEN_AI_CHAT_MODEL,
  });
}
