import { ShieldAlert } from 'lucide-react';

import { ActionLink } from '@/components/ui/action-link';
import { Card } from '@/components/ui/card';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { ROUTES } from '@/constants/routes.constant';
import { cn } from '@/utils';

interface AdminForbiddenPanelProps {
  className?: string;
}

export function AdminForbiddenPanel({ className }: AdminForbiddenPanelProps) {
  return (
    <section className={cn('admin-section', className)}>
      <Card tone="surface" className="admin-forbidden-card">
        <div className="admin-forbidden-head">
          <ShieldAlert size={22} aria-hidden="true" />
          <h2 className="admin-section-title">
            {ADMIN_CATALOG_COPY.SHELL.FORBIDDEN_TITLE}
          </h2>
        </div>
        <p className="admin-section-subtitle">
          {ADMIN_CATALOG_COPY.SHELL.FORBIDDEN_DESC}
        </p>
        <div>
          <ActionLink href={ROUTES.ADMIN} variant="primary" size="sm">
            {ADMIN_CATALOG_COPY.SHELL.BACK_TO_OVERVIEW}
          </ActionLink>
        </div>
      </Card>
    </section>
  );
}
