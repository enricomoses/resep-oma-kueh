import { ActionLink } from '@/components/ui/action-link';
import { Card } from '@/components/ui/card';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { ROUTES } from '@/constants/routes.constant';
import { cn } from '@/utils';

interface QuickActionLink {
  href: string;
  label: string;
  variant?: 'primary' | 'secondary';
}

const OWNER_QUICK_ACTIONS: QuickActionLink[] = [
  {
    href: ROUTES.ADMIN_CATEGORIES,
    label: ADMIN_CATALOG_COPY.OVERVIEW.MANAGE_CATEGORIES,
    variant: 'primary',
  },
  {
    href: ROUTES.ADMIN_PRODUCTS,
    label: ADMIN_CATALOG_COPY.OVERVIEW.MANAGE_PRODUCTS,
  },
  {
    href: ROUTES.ADMIN_AVAILABILITY,
    label: ADMIN_CATALOG_COPY.AVAILABILITY.TITLE,
  },
  { href: ROUTES.ADMIN_LOCATIONS, label: ADMIN_CATALOG_COPY.LOCATIONS.TITLE },
  { href: ROUTES.ADMIN_PROMOTIONS, label: ADMIN_CATALOG_COPY.PROMOTIONS.TITLE },
  { href: ROUTES.ADMIN_CONTENT, label: ADMIN_CATALOG_COPY.CMS.TITLE },
  { href: ROUTES.ADMIN_FAQS, label: ADMIN_CATALOG_COPY.FAQS.TITLE },
  {
    href: ROUTES.ADMIN_TESTIMONIALS,
    label: ADMIN_CATALOG_COPY.TESTIMONIALS.TITLE,
  },
  { href: ROUTES.ADMIN_CLASSES, label: ADMIN_CATALOG_COPY.CLASSES.TITLE },
];

const STAFF_QUICK_ACTIONS: QuickActionLink[] = [
  {
    href: ROUTES.ADMIN_AVAILABILITY,
    label: ADMIN_CATALOG_COPY.AVAILABILITY.TITLE,
    variant: 'primary',
  },
  { href: ROUTES.ADMIN_CLASSES, label: ADMIN_CATALOG_COPY.CLASSES.TITLE },
];

interface AdminQuickActionsCardProps {
  isOwner: boolean;
  className?: string;
}

export function AdminQuickActionsCard({
  isOwner,
  className,
}: AdminQuickActionsCardProps) {
  const actions = isOwner ? OWNER_QUICK_ACTIONS : STAFF_QUICK_ACTIONS;

  return (
    <Card tone="cream" className={cn('admin-quick-actions-card', className)}>
      {isOwner ? (
        <h3 className="admin-card-title">
          {ADMIN_CATALOG_COPY.OVERVIEW.QUICK_ACTIONS_TITLE}
        </h3>
      ) : null}
      <p className="admin-section-subtitle">
        {isOwner
          ? ADMIN_CATALOG_COPY.OVERVIEW.SCOPE_NOTE_OWNER
          : ADMIN_CATALOG_COPY.OVERVIEW.SCOPE_NOTE_STAFF}
      </p>
      <div className="admin-inline-actions">
        {actions.map((action) => (
          <ActionLink
            key={action.href}
            href={action.href}
            variant={action.variant ?? 'secondary'}
            size="sm"
          >
            {action.label}
          </ActionLink>
        ))}
      </div>
    </Card>
  );
}
