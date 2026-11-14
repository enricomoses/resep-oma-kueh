import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils';

interface AdminIdentityBadgesProps {
  displayName: string;
  email?: string | null;
  roleLabel: string;
  branchScope: string;
  showEmail?: boolean;
  className?: string;
}

export function AdminIdentityBadges({
  displayName,
  email,
  roleLabel,
  branchScope,
  showEmail = false,
  className,
}: AdminIdentityBadgesProps) {
  return (
    <div className={cn('admin-sidebar-identity', className)}>
      <p className="admin-shell-name">{displayName}</p>
      {showEmail && email ? <p className="admin-shell-email">{email}</p> : null}
      <div className="admin-shell-badges">
        <Badge tone="accent">{roleLabel}</Badge>
        <Badge tone="neutral">{branchScope}</Badge>
      </div>
    </div>
  );
}
