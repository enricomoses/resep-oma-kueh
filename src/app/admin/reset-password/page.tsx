import type { Metadata } from 'next';
import { connection } from 'next/server';

import { AdminResetPasswordView } from './_components/admin-reset-password-view';
import { AUTH_COPY } from '@/constants/auth.constant';
import { verifyAdminAccess } from '@/features/auth/admin-guard.server';
import type { AuthErrorReason } from '@/types/auth';

export const metadata: Metadata = {
  title: AUTH_COPY.RESET_META_TITLE,
  robots: { index: false, follow: false },
};

export default async function AdminResetPasswordPage() {
  await connection();
  const verification = await verifyAdminAccess();

  if (verification.status === 'authenticated') {
    return (
      <AdminResetPasswordView
        hasValidRecoverySession
        profile={verification.profile}
      />
    );
  }

  const errorReason: AuthErrorReason =
    verification.status === 'profile_missing'
      ? 'profile_missing'
      : verification.status === 'profile_inactive'
        ? 'profile_inactive'
        : verification.status === 'session_expired'
          ? 'recovery_expired'
          : 'recovery_invalid';

  return (
    <AdminResetPasswordView
      hasValidRecoverySession={false}
      errorReason={errorReason}
    />
  );
}
