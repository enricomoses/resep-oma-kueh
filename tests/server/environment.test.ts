import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import {
  getServerEnvironment,
  serverEnvironmentSchema,
} from '@/config/environment.server';
import { parseEnvironment } from '@/config/parse-environment';
import {
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/response.server';

afterEach(() => vi.unstubAllEnvs());

describe('server configuration', () => {
  it('requires production to explicitly disable demo mode', () => {
    vi.stubEnv('APP_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_DEMO_MODE', 'true');
    expect(() => getServerEnvironment()).toThrow('NEXT_PUBLIC_DEMO_MODE');
    vi.stubEnv('NEXT_PUBLIC_DEMO_MODE', 'false');
    expect(getServerEnvironment().APP_ENV).toBe('production');
  });
  it('works with provider disabled and no provider key/model', () => {
    vi.stubEnv('APP_ENV', 'test');
    vi.stubEnv('CHAT_PROVIDER_ENABLED', 'false');
    vi.stubEnv('GOOGLE_GEN_AI_API_KEY', undefined);
    vi.stubEnv('GOOGLE_GEN_AI_CHAT_MODEL', undefined);
    expect(getServerEnvironment()).toMatchObject({
      APP_ENV: 'test',
      CHAT_PROVIDER_ENABLED: false,
    });
  });
  it('fails closed for premature provider activation, missing limiter store/quota, or HTTP store in production without echoing secrets', () => {
    for (const input of [
      { APP_ENV: 'invalid', GOOGLE_GEN_AI_API_KEY: 'synthetic-private' },
      { CHAT_PROVIDER_ENABLED: 'true' },
      {
        APP_ENV: 'production',
        CHAT_PROVIDER_ENABLED: 'true',
        GOOGLE_GEN_AI_API_KEY: 'synthetic-private-key',
        GOOGLE_GEN_AI_CHAT_MODEL: 'gemini-custom-test',
        CHAT_GENERATIVE_QUOTA_PER_DAY: '500',
        CHAT_LIMITER_STORE_URL: 'http://localhost:8079',
        CHAT_LIMITER_STORE_TOKEN: 'synthetic-store-token',
      },
      {
        APP_ENV: 'development',
        CHAT_PROVIDER_ENABLED: 'true',
        GOOGLE_GEN_AI_API_KEY: 'synthetic-private-key',
        GOOGLE_GEN_AI_CHAT_MODEL: 'gemini-custom-test',
      },
    ]) {
      expect(() => parseEnvironment(serverEnvironmentSchema, input)).toThrow();
      try {
        parseEnvironment(serverEnvironmentSchema, input);
      } catch (error: unknown) {
        expect(String(error)).not.toContain('synthetic-private');
        expect(String(error)).not.toContain('synthetic-store-token');
        expect(error).not.toHaveProperty('cause');
      }
    }
  });
  it('accepts complete F23 generative environment with external HTTPS limiter and custom model without hardcoded default', () => {
    const parsed = parseEnvironment(serverEnvironmentSchema, {
      APP_ENV: 'production',
      CHAT_PROVIDER_ENABLED: 'true',
      GOOGLE_GEN_AI_API_KEY: 'synthetic-private-key',
      GOOGLE_GEN_AI_CHAT_MODEL: 'gemini-custom-test',
      CHAT_GENERATIVE_QUOTA_PER_DAY: '250',
      CHAT_GENERATIVE_RPM_LIMIT: '8',
      CHAT_GENERATIVE_GLOBAL_RPM_LIMIT: '25',
      CHAT_GENERATIVE_MAX_CONCURRENCY: '4',
      CHAT_LIMITER_STORE_URL: 'https://limiter.example.invalid',
      CHAT_LIMITER_STORE_TOKEN: 'synthetic-store-token',
    });
    expect(parsed).toMatchObject({
      APP_ENV: 'production',
      CHAT_PROVIDER_ENABLED: true,
      GOOGLE_GEN_AI_CHAT_MODEL: 'gemini-custom-test',
      CHAT_GENERATIVE_QUOTA_PER_DAY: 250,
      CHAT_GENERATIVE_RPM_LIMIT: 8,
      CHAT_GENERATIVE_GLOBAL_RPM_LIMIT: 25,
      CHAT_GENERATIVE_MAX_CONCURRENCY: 4,
    });
  });
});

it('validates successful server output and emits sanitized no-store failures', async () => {
  const success = createSuccessResponse(
    z.string(),
    'fixture',
    'fixture-request',
  );
  expect(await success.json()).toEqual({
    ok: true,
    data: 'fixture',
    requestId: 'fixture-request',
  });
  expect(success.headers.get('cache-control')).toBe('no-store');
  const invalid = createSuccessResponse(
    z.number().positive(),
    -1,
    'invalid-request',
  );
  expect(invalid.status).toBe(500);
  const failure = createErrorResponse('failed-request');
  expect(await failure.json()).toMatchObject({
    ok: false,
    requestId: 'failed-request',
    error: { code: 'INTERNAL_ERROR' },
  });
});
