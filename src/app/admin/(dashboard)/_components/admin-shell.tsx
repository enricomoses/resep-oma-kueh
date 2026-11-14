'use client';

import { LogOut, Menu, Store } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { ActionLink } from '@/components/ui/action-link';
import { Button } from '@/components/ui/button';
import { Drawer } from '@/components/ui/drawer';
import { Feedback } from '@/components/ui/feedback';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { AUTH_COPY } from '@/constants/auth.constant';
import { ROUTES } from '@/constants/routes.constant';
import { useAdminLogout, useAdminSession } from '@/hooks/use-admin-auth';
import { ApiClientError } from '@/lib/errors';
import type { AdminSessionProfile } from '@/types/auth';
import { cn } from '@/utils';
import { AdminIdentityBadges } from './admin-identity-badges';
import { AdminSidebarNav } from './admin-sidebar-nav';

interface AdminShellProps {
  initialProfile: AdminSessionProfile;
  children?: ReactNode;
  className?: string;
}

export function AdminShell({
  initialProfile,
  children,
  className,
}: AdminShellProps) {
  const router = useRouter();
  const pathname = usePathname() ?? ROUTES.ADMIN;
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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
    <div className={cn('admin-workspace', className)}>
      <aside className="admin-sidebar" aria-label="Sidebar admin">
        <div className="admin-sidebar-brand">
          <p className="admin-shell-eyebrow">{AUTH_COPY.SHELL.EYEBROW}</p>
          <p className="admin-sidebar-brand-title">Resep Oma Kueh</p>
          <p className="admin-sidebar-brand-sub">
            {ADMIN_CATALOG_COPY.SHELL.BRAND_SUBTITLE}
          </p>
        </div>

        <AdminIdentityBadges
          displayName={activeProfile.displayName}
          email={activeProfile.email}
          roleLabel={roleLabel}
          branchScope={branchScope}
          showEmail
        />

        <AdminSidebarNav role={activeProfile.role} pathname={pathname} />
      </aside>

      <div className="admin-workspace-body">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="admin-mobile-menu-btn"
              aria-label={ADMIN_CATALOG_COPY.SHELL.OPEN_NAV}
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu size={18} aria-hidden="true" />
              <span>Menu</span>
            </Button>
            <div className="admin-topbar-title-wrap">
              <h1 className="admin-topbar-heading">
                {AUTH_COPY.SHELL.HEADING}
              </h1>
              <p className="admin-topbar-meta">
                {activeProfile.displayName} · {roleLabel} · {branchScope}
              </p>
            </div>
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
          <div className="admin-topbar-feedback">
            <Feedback tone="error" title={logoutError} announce />
          </div>
        ) : null}

        <main className="admin-shell-main">{children}</main>
      </div>

      <Drawer
        open={mobileNavOpen}
        onOpenChange={setMobileNavOpen}
        title={ADMIN_CATALOG_COPY.SHELL.NAV_LABEL}
        description={branchScope}
      >
        <div className="admin-drawer-content">
          <AdminIdentityBadges
            displayName={activeProfile.displayName}
            roleLabel={roleLabel}
            branchScope={branchScope}
          />
          <AdminSidebarNav
            role={activeProfile.role}
            pathname={pathname}
            onNavigate={() => setMobileNavOpen(false)}
          />
        </div>
      </Drawer>
    </div>
  );
}
