'use client';

import { LogOut, Menu, PanelLeft, Store } from 'lucide-react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useState, useSyncExternalStore } from 'react';

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

const SIDEBAR_STORAGE_KEY = 'rok-admin-sidebar-collapsed';
let fallbackSidebarCollapsed = false;
const sidebarCollapsedListeners = new Set<() => void>();

function subscribeSidebarCollapsed(listener: () => void) {
  sidebarCollapsedListeners.add(listener);
  const handleStorage = (event: StorageEvent) => {
    if (event.key === SIDEBAR_STORAGE_KEY) {
      listener();
    }
  };
  window.addEventListener('storage', handleStorage);
  return () => {
    sidebarCollapsedListeners.delete(listener);
    window.removeEventListener('storage', handleStorage);
  };
}

function getSidebarCollapsedSnapshot(): boolean {
  try {
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
  } catch {
    return fallbackSidebarCollapsed;
  }
}

function getSidebarCollapsedServerSnapshot(): boolean {
  return false;
}

function writeSidebarCollapsed(next: boolean) {
  fallbackSidebarCollapsed = next;
  try {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
  } catch {
    // Ignore storage access errors in restricted browser contexts.
  }
  sidebarCollapsedListeners.forEach((listener) => listener());
}

interface AdminShellProps {
  initialProfile: AdminSessionProfile;
  children?: ReactNode;
  className?: string;
}

/** Fixed collapsible admin workspace shell with role-scoped navigation and profile card. */
export function AdminShell({
  initialProfile,
  children,
  className,
}: AdminShellProps) {
  const router = useRouter();
  const pathname = usePathname() ?? ROUTES.ADMIN;
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const sidebarCollapsed = useSyncExternalStore(
    subscribeSidebarCollapsed,
    getSidebarCollapsedSnapshot,
    getSidebarCollapsedServerSnapshot,
  );
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [signedOut, setSignedOut] = useState(false);

  const sessionQuery = useAdminSession(signedOut ? null : initialProfile);
  const logoutMutation = useAdminLogout();

  const activeProfile = sessionQuery.data ?? initialProfile;

  function handleToggleSidebar() {
    writeSidebarCollapsed(!sidebarCollapsed);
  }

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

  const toggleLabel = sidebarCollapsed
    ? ADMIN_CATALOG_COPY.SHELL.EXPAND_SIDEBAR
    : ADMIN_CATALOG_COPY.SHELL.COLLAPSE_SIDEBAR;

  return (
    <div
      className={cn(
        'admin-workspace',
        sidebarCollapsed && 'admin-workspace--collapsed',
        className,
      )}
    >
      <aside
        className={cn(
          'admin-sidebar',
          sidebarCollapsed && 'admin-sidebar--collapsed',
        )}
        aria-label="Sidebar admin"
      >
        <div
          className={cn(
            'admin-sidebar-header',
            sidebarCollapsed && 'admin-sidebar-header--collapsed',
          )}
        >
          <div
            className={cn(
              'admin-sidebar-brand',
              sidebarCollapsed && 'admin-sidebar-brand--collapsed',
            )}
          >
            <span className="admin-sidebar-brand-mark" aria-hidden="true">
              <Image
                src="/images/oma.png"
                alt=""
                width={36}
                height={36}
                className="admin-sidebar-brand-image"
              />
            </span>
            {!sidebarCollapsed ? (
              <div className="admin-sidebar-brand-text">
                <p className="admin-sidebar-brand-title">
                  {ADMIN_CATALOG_COPY.SHELL.BRAND_TITLE}
                </p>
                <p className="admin-sidebar-brand-sub">
                  {ADMIN_CATALOG_COPY.SHELL.BRAND_SUBTITLE}
                </p>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            className="admin-sidebar-toggle"
            aria-label={toggleLabel}
            aria-expanded={!sidebarCollapsed}
            title={toggleLabel}
            onClick={handleToggleSidebar}
          >
            <PanelLeft size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="admin-sidebar-nav-scroll">
          {!sidebarCollapsed ? (
            <p className="admin-sidebar-section-label">
              {ADMIN_CATALOG_COPY.SHELL.NAV_SECTION_LABEL}
            </p>
          ) : null}
          <AdminSidebarNav
            role={activeProfile.role}
            pathname={pathname}
            collapsed={sidebarCollapsed}
          />
        </div>

        <div className="admin-sidebar-footer">
          <AdminIdentityBadges
            displayName={activeProfile.displayName}
            email={activeProfile.email}
            role={activeProfile.role}
            roleLabel={roleLabel}
            branchScope={branchScope}
            showEmail
            collapsed={sidebarCollapsed}
          />
        </div>
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
            email={activeProfile.email}
            role={activeProfile.role}
            roleLabel={roleLabel}
            branchScope={branchScope}
            showEmail
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
