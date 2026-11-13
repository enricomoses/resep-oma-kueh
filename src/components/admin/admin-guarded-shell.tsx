'use client';

import { LogOut, ShieldCheck, Store } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ActionLink } from '@/components/ui/action-link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { AUTH_COPY } from '@/constants/auth.constant';
import { ROUTES } from '@/constants/routes.constant';
import { useAdminLogout, useAdminSession } from '@/hooks/use-admin-auth';
import { ApiClientError } from '@/lib/errors';
import type { AdminSessionProfile } from '@/types/auth';
import { cn } from '@/utils';

interface AdminGuardedShellProps {
  initialProfile: AdminSessionProfile;
  className?: string;
}

export function AdminGuardedShell({
  initialProfile,
  className,
}: AdminGuardedShellProps) {
  const router = useRouter();
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [signedOut, setSignedOut] = useState(false);

  const sessionQuery = useAdminSession(signedOut ? null : initialProfile);
  const logoutMutation = useAdminLogout();

  const activeProfile = sessionQuery.data ?? initialProfile;
  const roleLabel =
    activeProfile.role === 'owner'
      ? AUTH_COPY.SHELL.ROLE_OWNER
      : AUTH_COPY.SHELL.ROLE_BRANCH_ADMIN;
  const branchScope =
    activeProfile.role === 'owner'
      ? AUTH_COPY.SHELL.BRANCH_ALL
      : `${activeProfile.branchName ?? 'Cabang Terkait'} (${activeProfile.branchCode ?? '-'})`;

  async function handleLogout() {
    setLogoutError(null);
    setSignedOut(true);
    try {
      await logoutMutation.mutateAsync();
      router.replace(ROUTES.ADMIN_LOGIN);
      router.refresh();
    } catch (err) {
      setSignedOut(false);
      if (err instanceof ApiClientError) {
        setLogoutError(err.message);
        return;
      }
      setLogoutError(AUTH_COPY.ERROR_INVALID_REQUEST);
    }
  }

  return (
    <section className={cn('admin-shell-page', className)}>
      <div className="content-container admin-shell-container">
        <header className="admin-shell-header">
          <div>
            <p className="admin-shell-eyebrow">{AUTH_COPY.SHELL.EYEBROW}</p>
            <h1 className="admin-shell-title">{AUTH_COPY.SHELL.HEADING}</h1>
            <p className="admin-shell-subtitle">{AUTH_COPY.SHELL.SUBTITLE}</p>
          </div>
          <div className="admin-shell-header-actions">
            <ActionLink href={ROUTES.HOME} variant="secondary" size="sm">
              <Store size={16} aria-hidden="true" />
              {AUTH_COPY.SHELL.BACK_TO_STOREFRONT}
            </ActionLink>
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={logoutMutation.isPending}
              loadingLabel={AUTH_COPY.SHELL.LOGGING_OUT}
              onClick={handleLogout}
            >
              <LogOut size={16} aria-hidden="true" />
              {AUTH_COPY.SHELL.LOGOUT_BUTTON}
            </Button>
          </div>
        </header>

        {logoutError ? (
          <Feedback tone="error" title={logoutError} announce />
        ) : null}

        <Card className="admin-shell-card" tone="surface">
          <div className="admin-shell-profile-top">
            <div className="admin-shell-identity">
              <ShieldCheck size={20} aria-hidden="true" />
              <div>
                <p className="admin-shell-name">{activeProfile.displayName}</p>
                {activeProfile.email ? (
                  <p className="admin-shell-email">{activeProfile.email}</p>
                ) : null}
              </div>
            </div>
            <Badge tone={activeProfile.role === 'owner' ? 'accent' : 'success'}>
              {roleLabel}
            </Badge>
          </div>

          <dl className="admin-shell-meta">
            <div>
              <dt>Cakupan Cabang</dt>
              <dd>{branchScope}</dd>
            </div>
            <div>
              <dt>ID Pengguna Terverifikasi</dt>
              <dd>
                <code>{activeProfile.userId}</code>
              </dd>
            </div>
          </dl>
        </Card>
      </div>
    </section>
  );
}
