import {
  ChevronRight,
  FileText,
  GraduationCap,
  HelpCircle,
  MapPin,
  Megaphone,
  MessageSquareQuote,
  Package,
  Store,
  Tags,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Card } from '@/components/ui/card';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { ROUTES } from '@/constants/routes.constant';
import { cn } from '@/utils';

interface QuickActionLink {
  href: string;
  label: string;
  icon: ReactNode;
  isPrimary?: boolean;
}

interface QuickActionGroup {
  title: string;
  items: readonly QuickActionLink[];
}

const OWNER_ACTION_GROUPS: readonly QuickActionGroup[] = [
  {
    title: 'Katalog & Operasional Cabang',
    items: [
      {
        href: ROUTES.ADMIN_CATEGORIES,
        label: ADMIN_CATALOG_COPY.OVERVIEW.MANAGE_CATEGORIES,
        icon: <Tags size={16} strokeWidth={1.75} />,
        isPrimary: true,
      },
      {
        href: ROUTES.ADMIN_PRODUCTS,
        label: ADMIN_CATALOG_COPY.OVERVIEW.MANAGE_PRODUCTS,
        icon: <Package size={16} strokeWidth={1.75} />,
      },
      {
        href: ROUTES.ADMIN_AVAILABILITY,
        label: ADMIN_CATALOG_COPY.AVAILABILITY.TITLE,
        icon: <Store size={16} strokeWidth={1.75} />,
      },
      {
        href: ROUTES.ADMIN_LOCATIONS,
        label: ADMIN_CATALOG_COPY.LOCATIONS.TITLE,
        icon: <MapPin size={16} strokeWidth={1.75} />,
      },
    ],
  },
  {
    title: 'Promosi, Konten & Kelas',
    items: [
      {
        href: ROUTES.ADMIN_PROMOTIONS,
        label: ADMIN_CATALOG_COPY.PROMOTIONS.TITLE,
        icon: <Megaphone size={16} strokeWidth={1.75} />,
      },
      {
        href: ROUTES.ADMIN_CONTENT,
        label: ADMIN_CATALOG_COPY.CMS.TITLE,
        icon: <FileText size={16} strokeWidth={1.75} />,
      },
      {
        href: ROUTES.ADMIN_FAQS,
        label: ADMIN_CATALOG_COPY.FAQS.TITLE,
        icon: <HelpCircle size={16} strokeWidth={1.75} />,
      },
      {
        href: ROUTES.ADMIN_TESTIMONIALS,
        label: ADMIN_CATALOG_COPY.TESTIMONIALS.TITLE,
        icon: <MessageSquareQuote size={16} strokeWidth={1.75} />,
      },
      {
        href: ROUTES.ADMIN_CLASSES,
        label: ADMIN_CATALOG_COPY.CLASSES.TITLE,
        icon: <GraduationCap size={16} strokeWidth={1.75} />,
      },
    ],
  },
];

const STAFF_ACTION_GROUPS: readonly QuickActionGroup[] = [
  {
    title: 'Modul Cabang Aktif',
    items: [
      {
        href: ROUTES.ADMIN_AVAILABILITY,
        label: ADMIN_CATALOG_COPY.AVAILABILITY.TITLE,
        icon: <Store size={16} strokeWidth={1.75} />,
        isPrimary: true,
      },
      {
        href: ROUTES.ADMIN_CLASSES,
        label: ADMIN_CATALOG_COPY.CLASSES.TITLE,
        icon: <GraduationCap size={16} strokeWidth={1.75} />,
      },
    ],
  },
];

interface AdminQuickActionsCardProps {
  isOwner: boolean;
  className?: string;
}

export function AdminQuickActionsCard({
  isOwner,
  className,
}: AdminQuickActionsCardProps) {
  const groups = isOwner ? OWNER_ACTION_GROUPS : STAFF_ACTION_GROUPS;

  return (
    <Card tone="surface" className={cn('admin-directory-card', className)}>
      <div className="admin-directory-head">
        {isOwner ? (
          <h3 className="admin-directory-title">
            {ADMIN_CATALOG_COPY.OVERVIEW.QUICK_ACTIONS_TITLE}
          </h3>
        ) : null}
        <p className="admin-directory-subtitle">
          {isOwner
            ? ADMIN_CATALOG_COPY.OVERVIEW.SCOPE_NOTE_OWNER
            : ADMIN_CATALOG_COPY.OVERVIEW.SCOPE_NOTE_STAFF}
        </p>
      </div>

      <div
        className={cn(
          'admin-directory-groups',
          groups.length > 1 && 'admin-directory-groups--two',
        )}
      >
        {groups.map((group) => (
          <div key={group.title} className="admin-directory-group">
            <h4 className="admin-directory-group-label">{group.title}</h4>
            <ul className="admin-directory-list">
              {group.items.map((action) => (
                <li key={action.href} className="admin-directory-item">
                  <Link
                    href={action.href}
                    className={cn(
                      'admin-directory-link',
                      action.isPrimary && 'admin-directory-link--primary',
                    )}
                  >
                    <span className="admin-directory-link-main">
                      <span
                        className="admin-directory-link-icon"
                        aria-hidden="true"
                      >
                        {action.icon}
                      </span>
                      <span className="admin-directory-link-label">
                        {action.label}
                      </span>
                    </span>
                    <ChevronRight
                      size={16}
                      className="admin-directory-link-chevron"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}
