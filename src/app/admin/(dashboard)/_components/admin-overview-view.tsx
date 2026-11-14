'use client';

import { RefreshCw } from 'lucide-react';

import { StatCard } from '@/components/common/cards/stat-card';
import { Button } from '@/components/ui/button';
import { Feedback } from '@/components/ui/feedback';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { useAdminOverview } from '@/hooks/use-admin-catalog';
import { ApiClientError } from '@/lib/errors';
import type { AdminOverviewResponse } from '@/types/admin-catalog';
import type { AdminSessionProfile } from '@/types/auth';
import { cn } from '@/utils';

import { AdminQuickActionsCard } from './admin-quick-actions-card';
import { AdminSectionHeader } from './admin-section-header';

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
      <AdminSectionHeader
        title={ADMIN_CATALOG_COPY.OVERVIEW.TITLE}
        description={
          isOwner
            ? ADMIN_CATALOG_COPY.OVERVIEW.SUBTITLE_OWNER
            : ADMIN_CATALOG_COPY.OVERVIEW.SUBTITLE_STAFF
        }
        actions={
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
        }
      />

      {errorMessage ? (
        <Feedback tone="error" title={errorMessage} announce />
      ) : null}

      {isOwner && ownerCounts ? (
        <>
          <div className="admin-stats-grid">
            <StatCard
              label={ADMIN_CATALOG_COPY.OVERVIEW.CARDS.PRODUCTS_PUBLISHED}
              value={ownerCounts.productsPublished}
              badgeTone="success"
              badgeText={`Draf: ${ownerCounts.productsDraft} · Arsip: ${ownerCounts.productsArchived}`}
            />
            <StatCard
              label={ADMIN_CATALOG_COPY.OVERVIEW.CARDS.PRODUCTS_DRAFT}
              value={ownerCounts.productsDraft}
              badgeTone="neutral"
              badgeText={`${ADMIN_CATALOG_COPY.OVERVIEW.CARDS.PRODUCTS_NEEDS_REVIEW}: ${ownerCounts.productsNeedsReview}`}
            />
            <StatCard
              label={ADMIN_CATALOG_COPY.OVERVIEW.CARDS.CATEGORIES_PUBLISHED}
              value={ownerCounts.categoriesPublished}
              badgeTone="neutral"
              badgeText={`Draf: ${ownerCounts.categoriesDraft} · Arsip: ${ownerCounts.categoriesArchived}`}
            />
            <StatCard
              label={ADMIN_CATALOG_COPY.OVERVIEW.CARDS.OFFERS_SOLD_OUT}
              value={ownerCounts.soldOutOffers}
              badgeTone="accent"
              badgeText={`${ADMIN_CATALOG_COPY.OVERVIEW.CARDS.BRANCHES_ACTIVE}: ${ownerCounts.activeBranches}`}
            />
            <StatCard
              label={ADMIN_CATALOG_COPY.OVERVIEW.CARDS.PROMOTIONS_ACTIVE}
              value={ownerCounts.activePromotions}
              badgeTone="neutral"
              badgeText={`${ADMIN_CATALOG_COPY.OVERVIEW.CARDS.SESSIONS_UPCOMING}: ${ownerCounts.upcomingSessions}`}
            />
          </div>

          <AdminQuickActionsCard isOwner />
        </>
      ) : staffCounts ? (
        <>
          <div className="admin-stats-grid">
            <StatCard
              label={ADMIN_CATALOG_COPY.OVERVIEW.CARDS.STAFF_AVAILABLE_OFFERS}
              value={staffCounts.availableOffers}
              badgeTone="success"
              badgeText={overview.branchName ?? 'Cabang'}
            />
            <StatCard
              label={ADMIN_CATALOG_COPY.OVERVIEW.CARDS.STAFF_SOLDOUT_OFFERS}
              value={staffCounts.soldOutOffers}
              badgeTone="accent"
              badgeText="Perlu pantauan stok"
            />
            <StatCard
              label={ADMIN_CATALOG_COPY.OVERVIEW.CARDS.STAFF_UPCOMING_SESSIONS}
              value={staffCounts.upcomingSessions}
              badgeTone="neutral"
              badgeText="Status terjadwal"
            />
          </div>

          <AdminQuickActionsCard isOwner={false} />
        </>
      ) : null}
    </section>
  );
}
