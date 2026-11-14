import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';

import { AdminLoginView } from './_components/admin-login-view';
import { AUTH_COPY } from '@/constants/auth.constant';
import { ROUTES } from '@/constants/routes.constant';
import { verifyAdminAccess } from '@/features/auth/admin-guard.server';
import { resolveSafeAdminRedirectPath } from '@/utils/auth-redirect';
import { authErrorReasonSchema } from '@/validations/auth.schema';

export const metadata: Metadata = {
  title: AUTH_COPY.LOGIN_META_TITLE,
  robots: { index: false, follow: false },
};

function firstQueryValue(value: string | string[] | undefined): string | null {
  return typeof value === 'string' ? value : null;
}

export default async function AdminLoginPage({
  searchParams,
}: PageProps<'/admin/login'>) {
  await connection();
  const params = await searchParams;
  const safeNext = resolveSafeAdminRedirectPath(
    firstQueryValue(params.next),
    ROUTES.ADMIN,
  );
  const parsedError = authErrorReasonSchema.safeParse(
    firstQueryValue(params.error),
  );
  const initialErrorReason = parsedError.success ? parsedError.data : null;

  const verification = await verifyAdminAccess();
  if (verification.status === 'authenticated') {
    redirect(safeNext);
  }

  return (
    <AdminLoginView
      nextPath={safeNext}
      initialErrorReason={initialErrorReason}
    />
  );
}
