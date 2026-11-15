import { Crown, MapPin, UserCheck } from 'lucide-react';

import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import type { AdminRole } from '@/types/auth';
import { cn } from '@/utils';

interface AdminIdentityBadgesProps {
  displayName: string;
  email?: string | null;
  role?: AdminRole;
  roleLabel: string;
  branchScope: string;
  showEmail?: boolean;
  collapsed?: boolean;
  className?: string;
}

/** Extract up to two uppercase initials from an admin display name. */
function getAdminInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'A';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

/** Profile card displaying the authenticated admin identity, role, and branch scope. */
export function AdminIdentityBadges({
  displayName,
  email,
  role = 'owner',
  roleLabel,
  branchScope,
  showEmail = false,
  collapsed = false,
  className,
}: AdminIdentityBadgesProps) {
  const RoleIcon = role === 'owner' ? Crown : UserCheck;
  const initials = getAdminInitials(displayName);
  const summaryTitle = `${displayName} · ${roleLabel} · ${branchScope}`;

  if (collapsed) {
    return (
      <div
        className={cn(
          'admin-profile-card admin-profile-card--collapsed',
          className,
        )}
        title={summaryTitle}
        aria-label={ADMIN_CATALOG_COPY.SHELL.PROFILE_LABEL}
      >
        <span className="admin-profile-avatar" aria-hidden="true">
          <span>{initials}</span>
        </span>
        <div className="admin-sr-only">
          <p>{displayName}</p>
          {showEmail && email ? <p>{email}</p> : null}
          <p>{roleLabel}</p>
          <p>{branchScope}</p>
        </div>
      </div>
    );
  }

  return (
    <section
      className={cn('admin-profile-card', className)}
      aria-label={ADMIN_CATALOG_COPY.SHELL.PROFILE_LABEL}
    >
      <div className="admin-profile-header">
        <span className="admin-profile-avatar" aria-hidden="true">
          <span>{initials}</span>
        </span>

        <div className="admin-profile-info">
          <p className="admin-profile-name" title={displayName}>
            {displayName}
          </p>
          {showEmail && email ? (
            <p className="admin-profile-email" title={email}>
              {email}
            </p>
          ) : null}
        </div>
      </div>

      <div className="admin-profile-meta">
        <div className="admin-profile-meta-row">
          <RoleIcon
            size={14}
            className="admin-profile-meta-icon"
            aria-hidden="true"
          />
          <span className="admin-profile-role">{roleLabel}</span>
        </div>

        <div className="admin-profile-meta-row">
          <MapPin
            size={14}
            className="admin-profile-meta-icon"
            aria-hidden="true"
          />
          <span className="admin-profile-branch" title={branchScope}>
            {branchScope}
          </span>
        </div>
      </div>
    </section>
  );
}
