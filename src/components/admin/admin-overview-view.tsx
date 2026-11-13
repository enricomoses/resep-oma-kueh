'use client';

import { RefreshCw } from 'lucide-react';

import { ActionLink } from '@/components/ui/action-link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { ROUTES } from '@/constants/routes.constant';
import { useAdminOverview } from '@/hooks/use-admin-catalog';
import { ApiClientError } from '@/lib/errors';
import type { AdminOverviewResponse } from '@/types/admin-catalog';
import type { AdminSessionProfile } from '@/types/auth';
import { cn } from '@/utils';

interface AdminOverviewViewProps {
  profile: AdminSessionProfile;
  initialOverview: AdminOverviewResponse;
  className?: string;
}

export function AdminOverviewView({
  profile,
  initialOverview,
  className,
}: AdminOverviewViewProps) {
  const overviewQuery = useAdminOverview(profile, initialOverview);
  const overview = overviewQuery.data ?? initialOverview;

  const isOwner = overview.role === 'owner' && overview.ownerCounts !== null;
  const ownerCounts = overview.ownerCounts;
  const staffCounts = overview.staffCounts;

  const errorMessage =
    overviewQuery.error instanceof ApiClientError
      ? overviewQuery.error.message
      : overviewQuery.error
        ? ADMIN_CATALOG_COPY.OVERVIEW.ERROR_LOAD
        : null;

  return (
    <section className={cn('admin-section', className)}>
      <div className="admin-section-header">
        <div>
          <h2 className="admin-section-title">
            {ADMIN_CATALOG_COPY.OVERVIEW.TITLE}
          </h2>
          <p className="admin-section-subtitle">
            {isOwner
              ? ADMIN_CATALOG_COPY.OVERVIEW.SUBTITLE_OWNER
              : ADMIN_CATALOG_COPY.OVERVIEW.SUBTITLE_STAFF}
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={overviewQuery.isFetching}
          loadingLabel={ADMIN_CATALOG_COPY.OVERVIEW.REFRESH}
          onClick={() => {
            void overviewQuery.refetch();
          }}
        >
          <RefreshCw size={16} aria-hidden="true" />
          <span>{ADMIN_CATALOG_COPY.OVERVIEW.REFRESH}</span>
        </Button>
      </div>

      {errorMessage ? (
        <Feedback tone="error" title={errorMessage} announce />
      ) : null}

      {isOwner && ownerCounts ? (
        <>
          <div className="admin-stats-grid">
            <Card tone="surface" className="admin-stat-card">
              <p className="admin-stat-label">
                {ADMIN_CATALOG_COPY.OVERVIEW.CARDS.PRODUCTS_PUBLISHED}
              </p>
              <p className="admin-stat-value">
                {ownerCounts.productsPublished}
              </p>
              <Badge tone="success">
                Draf: {ownerCounts.productsDraft} · Arsip:{' '}
                {ownerCounts.productsArchived}
              </Badge>
            </Card>
            <Card tone="surface" className="admin-stat-card">
              <p className="admin-stat-label">
                {ADMIN_CATALOG_COPY.OVERVIEW.CARDS.PRODUCTS_DRAFT}
              </p>
              <p className="admin-stat-value">{ownerCounts.productsDraft}</p>
              <Badge tone="neutral">
                {ADMIN_CATALOG_COPY.OVERVIEW.CARDS.PRODUCTS_NEEDS_REVIEW}:{' '}
                {ownerCounts.productsNeedsReview}
              </Badge>
            </Card>
            <Card tone="surface" className="admin-stat-card">
              <p className="admin-stat-label">
                {ADMIN_CATALOG_COPY.OVERVIEW.CARDS.CATEGORIES_PUBLISHED}
              </p>
              <p className="admin-stat-value">
                {ownerCounts.categoriesPublished}
              </p>
              <Badge tone="neutral">
                Draf: {ownerCounts.categoriesDraft} · Arsip:{' '}
                {ownerCounts.categoriesArchived}
              </Badge>
            </Card>
            <Card tone="surface" className="admin-stat-card">
              <p className="admin-stat-label">
                {ADMIN_CATALOG_COPY.OVERVIEW.CARDS.OFFERS_SOLD_OUT}
              </p>
              <p className="admin-stat-value">{ownerCounts.soldOutOffers}</p>
              <Badge tone="accent">
                {ADMIN_CATALOG_COPY.OVERVIEW.CARDS.BRANCHES_ACTIVE}:{' '}
                {ownerCounts.activeBranches}
              </Badge>
            </Card>
            <Card tone="surface" className="admin-stat-card">
              <p className="admin-stat-label">
                {ADMIN_CATALOG_COPY.OVERVIEW.CARDS.PROMOTIONS_ACTIVE}
              </p>
              <p className="admin-stat-value">{ownerCounts.activePromotions}</p>
              <Badge tone="neutral">
                {ADMIN_CATALOG_COPY.OVERVIEW.CARDS.SESSIONS_UPCOMING}:{' '}
                {ownerCounts.upcomingSessions}
              </Badge>
            </Card>
          </div>

          <Card tone="cream" className="admin-quick-actions-card">
            <h3 className="admin-card-title">
              {ADMIN_CATALOG_COPY.OVERVIEW.QUICK_ACTIONS_TITLE}
            </h3>
            <p className="admin-section-subtitle">
              {ADMIN_CATALOG_COPY.OVERVIEW.SCOPE_NOTE_OWNER}
            </p>
            <div className="admin-inline-actions">
              <ActionLink
                href={ROUTES.ADMIN_CATEGORIES}
                variant="primary"
                size="sm"
              >
                {ADMIN_CATALOG_COPY.OVERVIEW.MANAGE_CATEGORIES}
              </ActionLink>
              <ActionLink
                href={ROUTES.ADMIN_PRODUCTS}
                variant="secondary"
                size="sm"
              >
                {ADMIN_CATALOG_COPY.OVERVIEW.MANAGE_PRODUCTS}
              </ActionLink>
            </div>
          </Card>
        </>
      ) : staffCounts ? (
        <>
          <div className="admin-stats-grid">
            <Card tone="surface" className="admin-stat-card">
              <p className="admin-stat-label">
                {ADMIN_CATALOG_COPY.OVERVIEW.CARDS.STAFF_AVAILABLE_OFFERS}
              </p>
              <p className="admin-stat-value">{staffCounts.availableOffers}</p>
              <Badge tone="success">{overview.branchName ?? 'Cabang'}</Badge>
            </Card>
            <Card tone="surface" className="admin-stat-card">
              <p className="admin-stat-label">
                {ADMIN_CATALOG_COPY.OVERVIEW.CARDS.STAFF_SOLDOUT_OFFERS}
              </p>
              <p className="admin-stat-value">{staffCounts.soldOutOffers}</p>
              <Badge tone="accent">Perlu pantauan stok</Badge>
            </Card>
            <Card tone="surface" className="admin-stat-card">
              <p className="admin-stat-label">
                {ADMIN_CATALOG_COPY.OVERVIEW.CARDS.STAFF_UPCOMING_SESSIONS}
              </p>
              <p className="admin-stat-value">{staffCounts.upcomingSessions}</p>
              <Badge tone="neutral">Status terjadwal</Badge>
            </Card>
          </div>

          <Card tone="cream" className="admin-quick-actions-card">
            <p className="admin-section-subtitle">
              {ADMIN_CATALOG_COPY.OVERVIEW.SCOPE_NOTE_STAFF}
            </p>
          </Card>
        </>
      ) : null}
    </section>
  );
}
