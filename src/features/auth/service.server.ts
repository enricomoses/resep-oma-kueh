import 'server-only';

import type { User } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';

import { EnvironmentConfigurationError } from '@/config/parse-environment';
import { AUTH_COPY, AUTH_LIMITS } from '@/constants/auth.constant';
import { ROUTES } from '@/constants/routes.constant';
import { createServerAuthClient } from '@/lib/supabase/server';
import type {
  AdminSessionProfile,
  AuthErrorReason,
  LoginRequest,
  LoginResponse,
  PasswordResetResponse,
  UpdatePasswordResponse,
} from '@/types/auth';
import { resolveSafeAdminRedirectPath } from '@/utils/auth-redirect';

import {
  resolveActiveAdminProfile,
  verifyAdminAccess,
} from './admin-guard.server';
import {
  AuthForbiddenError,
  AuthRateLimitedError,
  AuthUnauthenticatedError,
  AuthUpstreamError,
  AuthValidationError,
} from './errors.server';
import { consumeAuthRateLimit, hashRateLimitKey } from './rate-limit.server';

async function clearLeftoverSupabaseCookies(carrier: NextResponse) {
  try {
    const store = await cookies();
    for (const cookie of store.getAll()) {
      if (
        cookie.name.startsWith('sb-') &&
        cookie.name.includes('-auth-token')
      ) {
        carrier.cookies.set(cookie.name, '', {
          path: '/',
          maxAge: 0,
          httpOnly: true,
          sameSite: 'lax',
        });
      }
    }
  } catch {
    // Ignore outside Next request context.
  }
}

async function getConfiguredAuthClient(carrier: NextResponse) {
  try {
    return await createServerAuthClient(carrier);
  } catch (error) {
    if (error instanceof EnvironmentConfigurationError) {
      throw new AuthUpstreamError();
    }
    throw error;
  }
}

export async function loginAdmin(
  input: LoginRequest,
  options: { ipHash: string; carrier: NextResponse },
): Promise<LoginResponse> {
  const ipLimit = consumeAuthRateLimit(
    `login:${options.ipHash}`,
    AUTH_LIMITS.LOGIN_RATE_LIMIT_MAX,
    AUTH_LIMITS.LOGIN_RATE_LIMIT_WINDOW_MS,
  );
  if (!ipLimit.allowed) {
    throw new AuthRateLimitedError(ipLimit.retryAfterSeconds);
  }

  const supabase = await getConfiguredAuthClient(options.carrier);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error || !data.user) {
    if (error && error.status === 429) {
      throw new AuthRateLimitedError(60);
    }
    if (error && error.status && error.status >= 500) {
      throw new AuthUpstreamError();
    }
    throw new AuthUnauthenticatedError(AUTH_COPY.ERROR_INVALID_CREDENTIALS);
  }

  const profileResult = await resolveActiveAdminProfile(supabase, data.user);
  if (profileResult.status !== 'authenticated') {
    await supabase.auth.signOut({ scope: 'local' });
    await clearLeftoverSupabaseCookies(options.carrier);
    throw new AuthForbiddenError(AUTH_COPY.ERROR_PROFILE_FORBIDDEN);
  }

  return {
    profile: profileResult.profile,
    redirectTo: resolveSafeAdminRedirectPath(input.next, ROUTES.ADMIN),
  };
}

export async function logoutAdmin(carrier: NextResponse): Promise<void> {
  try {
    const supabase = await getConfiguredAuthClient(carrier);
    await supabase.auth.signOut({ scope: 'local' });
  } catch {
    // Always clear cookies even if env is unconfigured or upstream fails transiently.
  }
  await clearLeftoverSupabaseCookies(carrier);
}

export async function requestAdminPasswordReset(
  email: string,
  options: {
    ipHash: string;
    redirectOrigin: string;
    carrier: NextResponse;
  },
): Promise<PasswordResetResponse> {
  const ipLimit = consumeAuthRateLimit(
    `reset-ip:${options.ipHash}`,
    AUTH_LIMITS.RESET_RATE_LIMIT_MAX,
    AUTH_LIMITS.RESET_RATE_LIMIT_WINDOW_MS,
  );
  const emailLimit = consumeAuthRateLimit(
    `reset-email:${hashRateLimitKey(email)}`,
    AUTH_LIMITS.RESET_RATE_LIMIT_MAX,
    AUTH_LIMITS.RESET_RATE_LIMIT_WINDOW_MS,
  );

  if (!ipLimit.allowed || !emailLimit.allowed) {
    throw new AuthRateLimitedError(
      Math.max(ipLimit.retryAfterSeconds, emailLimit.retryAfterSeconds),
    );
  }

  const redirectTo = `${options.redirectOrigin}${ROUTES.AUTH_CALLBACK}?next=${encodeURIComponent(ROUTES.ADMIN_RESET_PASSWORD)}`;
  const supabase = await getConfiguredAuthClient(options.carrier);
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error?.status === 429) {
    throw new AuthRateLimitedError(60);
  }

  // Always return a generic response so email existence is never disclosed.
  return {
    accepted: true,
    message: AUTH_COPY.GENERIC_RESET_RESPONSE,
  };
}

export async function updateAdminPassword(
  newPassword: string,
  carrier: NextResponse,
): Promise<UpdatePasswordResponse> {
  const verification = await verifyAdminAccess(carrier);

  if (
    verification.status === 'unauthenticated' ||
    verification.status === 'session_expired'
  ) {
    throw new AuthUnauthenticatedError(AUTH_COPY.ERROR_RECOVERY_SESSION);
  }

  const supabase = await getConfiguredAuthClient(carrier);

  if (verification.status !== 'authenticated') {
    await supabase.auth.signOut({ scope: 'local' });
    await clearLeftoverSupabaseCookies(carrier);
    throw new AuthForbiddenError(AUTH_COPY.ERROR_PROFILE_FORBIDDEN);
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    if (error.status === 422) {
      throw new AuthValidationError(AUTH_COPY.VALIDATION.PASSWORD_MIN, {
        password: [AUTH_COPY.VALIDATION.PASSWORD_MIN],
      });
    }
    if (error.status === 401 || error.status === 403) {
      throw new AuthUnauthenticatedError(AUTH_COPY.ERROR_RECOVERY_SESSION);
    }
    throw new AuthUpstreamError();
  }

  return {
    updated: true,
    redirectTo: ROUTES.ADMIN,
  };
}

export type AuthCallbackOutcome =
  | { ok: true; redirectTo: string; profile: AdminSessionProfile }
  | { ok: false; reason: AuthErrorReason };

export async function completeAuthCallback(options: {
  code: string | null;
  tokenHash: string | null;
  type: string | null;
  next: string | null;
  carrier: NextResponse;
}): Promise<AuthCallbackOutcome> {
  const hasToken =
    Boolean(options.code) ||
    (Boolean(options.tokenHash) && options.type === 'recovery');
  if (!hasToken) {
    return { ok: false, reason: 'recovery_invalid' };
  }

  let supabase: Awaited<ReturnType<typeof createServerAuthClient>>;
  try {
    supabase = await createServerAuthClient(options.carrier);
  } catch {
    return { ok: false, reason: 'recovery_invalid' };
  }

  let verifiedUser: User | null = null;

  if (options.code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(
      options.code,
    );
    if (error || !data.user) {
      await clearLeftoverSupabaseCookies(options.carrier);
      return { ok: false, reason: 'recovery_expired' };
    }
    verifiedUser = data.user;
  } else if (options.tokenHash && options.type === 'recovery') {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: options.tokenHash,
      type: 'recovery',
    });
    if (error || !data.user) {
      await clearLeftoverSupabaseCookies(options.carrier);
      return { ok: false, reason: 'recovery_expired' };
    }
    verifiedUser = data.user;
  } else {
    return { ok: false, reason: 'recovery_invalid' };
  }

  const profileResult = await resolveActiveAdminProfile(supabase, verifiedUser);

  if (profileResult.status !== 'authenticated') {
    await supabase.auth.signOut({ scope: 'local' });
    await clearLeftoverSupabaseCookies(options.carrier);
    return {
      ok: false,
      reason:
        profileResult.status === 'profile_missing'
          ? 'profile_missing'
          : 'profile_inactive',
    };
  }

  return {
    ok: true,
    profile: profileResult.profile,
    redirectTo: resolveSafeAdminRedirectPath(
      options.next,
      ROUTES.ADMIN_RESET_PASSWORD,
    ),
  };
}
