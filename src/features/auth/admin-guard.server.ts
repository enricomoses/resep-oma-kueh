import 'server-only';

import type { User } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { NextResponse } from 'next/server';

import { EnvironmentConfigurationError } from '@/config/parse-environment';
import { ROUTES } from '@/constants/routes.constant';
import { createServerAuthClient } from '@/lib/supabase/server';
import type { AdminRole, AdminSessionProfile } from '@/types/auth';
import { resolveSafeAdminRedirectPath } from '@/utils/auth-redirect';
import {
  adminRoleSchema,
  adminSessionProfileSchema,
} from '@/validations/auth.schema';

import {
  AuthForbiddenError,
  AuthUnauthenticatedError,
  AuthUpstreamError,
} from './errors.server';

type SupabaseAuthServerClient = Awaited<
  ReturnType<typeof createServerAuthClient>
>;

interface RawBranchRelation {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
}

interface RawAdminProfileRow {
  user_id: string;
  display_name: string;
  role: string;
  branch_id: string | null;
  is_active: boolean;
  branches: RawBranchRelation | RawBranchRelation[] | null;
}

export type AdminVerificationResult =
  | { status: 'authenticated'; profile: AdminSessionProfile; user: User }
  | { status: 'unauthenticated' }
  | { status: 'session_expired' }
  | { status: 'profile_missing'; userId: string }
  | { status: 'profile_inactive'; userId: string };

function normalizeBranchRelation(
  branches: RawAdminProfileRow['branches'],
): RawBranchRelation | null {
  if (!branches) return null;
  return Array.isArray(branches) ? (branches[0] ?? null) : branches;
}

async function hasSupabaseAuthCookie(): Promise<boolean> {
  try {
    const store = await cookies();
    return store
      .getAll()
      .some(
        (cookie) =>
          cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token'),
      );
  } catch {
    return false;
  }
}

export async function resolveActiveAdminProfile(
  supabase: SupabaseAuthServerClient,
  user: User,
): Promise<AdminVerificationResult> {
  const { data, error } = await supabase
    .from('admin_profiles')
    .select(
      'user_id, display_name, role, branch_id, is_active, branches ( id, code, name, is_active )',
    )
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    throw new AuthUpstreamError();
  }

  if (!data) {
    return { status: 'profile_missing', userId: user.id };
  }

  const row = data as RawAdminProfileRow;
  if (!row.is_active) {
    return { status: 'profile_inactive', userId: user.id };
  }

  const parsedRole = adminRoleSchema.safeParse(row.role);
  if (!parsedRole.success) {
    return { status: 'profile_inactive', userId: user.id };
  }

  const branch = normalizeBranchRelation(row.branches);
  if (parsedRole.data === 'branch_admin') {
    if (!row.branch_id || !branch || !branch.is_active) {
      return { status: 'profile_inactive', userId: user.id };
    }
  }

  const parsedProfile = adminSessionProfileSchema.safeParse({
    userId: row.user_id,
    email: user.email ?? null,
    displayName: row.display_name,
    role: parsedRole.data,
    branchId: parsedRole.data === 'owner' ? null : row.branch_id,
    branchCode:
      parsedRole.data === 'owner'
        ? null
        : branch?.code === 'surabaya' || branch?.code === 'bintaro'
          ? branch.code
          : null,
    branchName: parsedRole.data === 'owner' ? null : (branch?.name ?? null),
  });

  if (!parsedProfile.success) {
    return { status: 'profile_inactive', userId: user.id };
  }

  return {
    status: 'authenticated',
    profile: parsedProfile.data,
    user,
  };
}

/**
 * Verifies the request session with Supabase Auth (`getClaims` + `getUser`) and
 * checks the user's active `admin_profiles` record on every server entry point.
 * Never trusts `getSession()` or JWT user_metadata as an authorization source.
 */
export async function verifyAdminAccess(
  response?: NextResponse,
): Promise<AdminVerificationResult> {
  const hadAuthCookie = await hasSupabaseAuthCookie();
  let supabase: SupabaseAuthServerClient;
  try {
    supabase = await createServerAuthClient(response);
  } catch (error) {
    if (error instanceof EnvironmentConfigurationError) {
      if (!hadAuthCookie) {
        return { status: 'unauthenticated' };
      }
      throw new AuthUpstreamError();
    }
    throw error;
  }

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims) {
    return { status: hadAuthCookie ? 'session_expired' : 'unauthenticated' };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { status: hadAuthCookie ? 'session_expired' : 'unauthenticated' };
  }

  return resolveActiveAdminProfile(supabase, user);
}

/**
 * Server Component guard for `/admin` routes. Redirects unauthenticated or
 * disallowed users to `/admin/login` with an explicit allowlisted path/reason.
 */
export async function requireAdminSession(
  nextPath: string = ROUTES.ADMIN,
): Promise<AdminSessionProfile> {
  const safeNext = resolveSafeAdminRedirectPath(nextPath, ROUTES.ADMIN);
  const verification = await verifyAdminAccess();

  if (verification.status === 'authenticated') {
    return verification.profile;
  }

  if (verification.status === 'profile_missing') {
    redirect(`${ROUTES.ADMIN_LOGIN}?error=profile_missing`);
  }

  if (verification.status === 'profile_inactive') {
    redirect(`${ROUTES.ADMIN_LOGIN}?error=profile_inactive`);
  }

  if (verification.status === 'session_expired') {
    redirect(
      `${ROUTES.ADMIN_LOGIN}?error=session_expired&next=${encodeURIComponent(safeNext)}`,
    );
  }

  redirect(`${ROUTES.ADMIN_LOGIN}?next=${encodeURIComponent(safeNext)}`);
}

/**
 * Route Handler guard for `/api/admin/**`. Throws typed HTTP 401 (`UNAUTHENTICATED`)
 * or HTTP 403 (`FORBIDDEN`) errors rather than issuing HTML redirects.
 */
export async function requireApiAdmin(options?: {
  roles?: readonly AdminRole[];
  response?: NextResponse;
}): Promise<AdminSessionProfile> {
  const verification = await verifyAdminAccess(options?.response);

  if (
    verification.status === 'unauthenticated' ||
    verification.status === 'session_expired'
  ) {
    throw new AuthUnauthenticatedError();
  }

  if (
    verification.status === 'profile_missing' ||
    verification.status === 'profile_inactive'
  ) {
    throw new AuthForbiddenError();
  }

  if (options?.roles && !options.roles.includes(verification.profile.role)) {
    throw new AuthForbiddenError();
  }

  return verification.profile;
}
