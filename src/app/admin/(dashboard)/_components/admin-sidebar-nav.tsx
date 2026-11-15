'use client';

import {
  FileText,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  MapPin,
  Megaphone,
  MessageSquareQuote,
  Package,
  ShieldCheck,
  Store,
  Tags,
} from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import {
  ADMIN_CATALOG_COPY,
  ADMIN_NAV_ITEMS,
} from '@/constants/admin-catalog.constant';
import { ROUTES } from '@/constants/routes.constant';
import type { AdminRole } from '@/types/auth';
import { cn } from '@/utils';

function getNavIcon(id: string) {
  switch (id) {
    case 'overview':
      return <LayoutDashboard size={18} aria-hidden="true" />;
    case 'categories':
      return <Tags size={18} aria-hidden="true" />;
    case 'products':
      return <Package size={18} aria-hidden="true" />;
    case 'availability':
      return <Store size={18} aria-hidden="true" />;
    case 'locations':
      return <MapPin size={18} aria-hidden="true" />;
    case 'promotions':
      return <Megaphone size={18} aria-hidden="true" />;
    case 'content':
      return <FileText size={18} aria-hidden="true" />;
    case 'faqs':
      return <HelpCircle size={18} aria-hidden="true" />;
    case 'testimonials':
      return <MessageSquareQuote size={18} aria-hidden="true" />;
    case 'classes':
      return <GraduationCap size={18} aria-hidden="true" />;
    default:
      return <ShieldCheck size={18} aria-hidden="true" />;
  }
}

interface AdminSidebarNavProps {
  role: AdminRole;
  pathname: string;
  collapsed?: boolean;
  onNavigate?: () => void;
  className?: string;
}

/** Role-scoped admin navigation list supporting expanded and icon-only collapsed modes. */
export function AdminSidebarNav({
  role,
  pathname,
  collapsed = false,
  onNavigate,
  className,
}: AdminSidebarNavProps) {
  const visibleNavItems = ADMIN_NAV_ITEMS.filter((item) =>
    item.roles.includes(role),
  );

  return (
    <nav
      className={cn(
        'admin-nav-list',
        collapsed && 'admin-nav-list--collapsed',
        className,
      )}
      aria-label={ADMIN_CATALOG_COPY.SHELL.NAV_LABEL}
    >
      {visibleNavItems.map((item) => {
        if (item.implemented && item.href) {
          const isCurrent =
            item.href === ROUTES.ADMIN
              ? pathname === ROUTES.ADMIN
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={isCurrent ? 'page' : undefined}
              title={collapsed ? item.label : undefined}
              className={cn(
                'admin-nav-link',
                collapsed && 'admin-nav-link--collapsed',
                isCurrent && 'admin-nav-link--active',
              )}
              onClick={onNavigate}
            >
              <span className="admin-nav-icon">{getNavIcon(item.id)}</span>
              <span
                className={cn('admin-nav-label', collapsed && 'admin-sr-only')}
              >
                {item.label}
              </span>
            </Link>
          );
        }

        return (
          <div
            key={item.id}
            className={cn(
              'admin-nav-upcoming',
              collapsed && 'admin-nav-upcoming--collapsed',
            )}
            title={collapsed ? item.label : undefined}
          >
            <span className="admin-nav-upcoming-label">
              <span className="admin-nav-icon">{getNavIcon(item.id)}</span>
              <span
                className={cn('admin-nav-label', collapsed && 'admin-sr-only')}
              >
                {item.label}
              </span>
            </span>
            {!collapsed && item.stageTag ? (
              <Badge tone="neutral">{item.stageTag}</Badge>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
