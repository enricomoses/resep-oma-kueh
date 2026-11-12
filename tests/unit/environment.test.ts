import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  EnvironmentConfigurationError,
  parseEnvironment,
} from '@/config/parse-environment';
import {
  publicEnvironmentSchema,
  supabaseEnvironmentSchema,
} from '@/validations/env.schema';

describe('public environment boundary', () => {
  it('defaults to a visible demo and parses explicit false', () => {
    expect(
      parseEnvironment(publicEnvironmentSchema, {}).NEXT_PUBLIC_DEMO_MODE,
    ).toBe(true);
    expect(
      parseEnvironment(publicEnvironmentSchema, {
        NEXT_PUBLIC_DEMO_MODE: 'false',
      }).NEXT_PUBLIC_DEMO_MODE,
    ).toBe(false);
  });
  it('redacts unexpected exceptions thrown by custom validation', () => {
    const schema = z.string().transform(() => {
      throw new Error('synthetic-private');
    });
    expect(() => parseEnvironment(schema, 'synthetic-private')).toThrow(
      EnvironmentConfigurationError,
    );
    try {
      parseEnvironment(schema, 'synthetic-private');
    } catch (error: unknown) {
      expect(String(error)).not.toContain('synthetic-private');
      expect(error).not.toHaveProperty('cause');
    }
  });
  it('parses false explicitly and allows absent DB only in the pre-DB scaffold', () => {
    const env = parseEnvironment(publicEnvironmentSchema, {
      NEXT_PUBLIC_CHAT_WIDGET_ENABLED: 'false',
      NEXT_PUBLIC_SUPABASE_URL: '',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '',
    });
    expect(env.NEXT_PUBLIC_CHAT_WIDGET_ENABLED).toBe(false);
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBeUndefined();
    expect(() => parseEnvironment(supabaseEnvironmentSchema, {})).toThrow();
  });
  it.each(['yes', '1', 'FALSE'])('rejects an ambiguous boolean %s', (flag) => {
    expect(() =>
      parseEnvironment(publicEnvironmentSchema, {
        NEXT_PUBLIC_CHAT_WIDGET_ENABLED: flag,
      }),
    ).toThrow();
  });
  it('rejects malformed URL, extra keys and privileged keys without echoing values', () => {
    const privateValue = 'synthetic-sensitive-value';
    for (const input of [
      { NEXT_PUBLIC_SITE_URL: privateValue },
      { NEXT_PUBLIC_SITE_URL: 'https://user:password@example.test' },
      { NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: `sb_secret_${privateValue}` },
      { ADMIN_TOKEN: privateValue },
    ]) {
      expect(() => parseEnvironment(publicEnvironmentSchema, input)).toThrow(
        EnvironmentConfigurationError,
      );
      try {
        parseEnvironment(publicEnvironmentSchema, input);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(EnvironmentConfigurationError);
        expect(String(error)).not.toContain(privateValue);
        expect(String(error)).not.toContain('password');
        expect(error).not.toHaveProperty('cause');
      }
    }
  });
  it('accepts only an anon legacy JWT, never a service-role JWT', () => {
    const jwt = (role: string) =>
      `header.${btoa(JSON.stringify({ role }))}.signature`;
    expect(
      supabaseEnvironmentSchema.safeParse({
        url: 'http://127.0.0.1:54321',
        publishableKey: jwt('anon'),
      }).success,
    ).toBe(true);
    expect(
      supabaseEnvironmentSchema.safeParse({
        url: 'http://127.0.0.1:54321',
        publishableKey: jwt('service_role'),
      }).success,
    ).toBe(false);
  });
});
