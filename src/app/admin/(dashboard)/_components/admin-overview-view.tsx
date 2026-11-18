'use client';

import {
  AlertCircle,
  CheckCircle2,
  FileEdit,
  GraduationCap,
  Megaphone,
  Package,
  RefreshCw,
  Store,
  Tags,
} from 'lucide-react';

import { StatCard } from '@/components/common/cards/stat-card';
import { Button } from '@/components/ui/button';
import { Feedback } from '@/components/ui/feedback';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { ROUTES } from '@/constants/routes.constant';
import { useAdminOverview } from '@/hooks/queries/use-admin-catalog';
import { ApiClientError } from '@/lib/errors';
import '@/styles/features/admin-overview.css';
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
    <section className={cn('admin-section admin-overview-section', className)}>
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
          <div className="admin-overview-grid admin-overview-grid--owner">
            <StatCard
              label={ADMIN_CATALOG_COPY.OVERVIEW.CARDS.PRODUCTS_PUBLISHED}
              value={ownerCounts.productsPublished}
              icon={<Package size={16} strokeWidth={1.75} />}
              badgeTone="success"
              badgeText="Tampil di katalog publik"
              metaItems={[
                { label: 'Draf', value: ownerCounts.productsDraft },
                { label: 'Arsip', value: ownerCounts.productsArchived },
              ]}
              href={ROUTES.ADMIN_PRODUCTS}
              linkLabel="Kelola Produk"
            />
            <StatCard
              label={ADMIN_CATALOG_COPY.OVERVIEW.CARDS.PRODUCTS_DRAFT}
              value={ownerCounts.productsDraft}
              icon={<FileEdit size={16} strokeWidth={1.75} />}
              badgeTone={
                ownerCounts.productsNeedsReview > 0 ? 'accent' : 'success'
              }
              badgeText={
                ownerCounts.productsNeedsReview > 0
                  ? `${ADMIN_CATALOG_COPY.OVERVIEW.CARDS.PRODUCTS_NEEDS_REVIEW}: ${ownerCounts.productsNeedsReview}`
                  : 'Semua draf telah ditinjau'
              }
              metaItems={[
                {
                  label: 'Perlu Review',
                  value: ownerCounts.productsNeedsReview,
                },
              ]}
              href={ROUTES.ADMIN_PRODUCTS}
              linkLabel="Tinjau Draf"
            />
            <StatCard
              label={ADMIN_CATALOG_COPY.OVERVIEW.CARDS.CATEGORIES_PUBLISHED}
              value={ownerCounts.categoriesPublished}
              icon={<Tags size={16} strokeWidth={1.75} />}
              badgeTone="neutral"
              badgeText="Hierarki menu aktif"
              metaItems={[
                { label: 'Draf', value: ownerCounts.categoriesDraft },
                { label: 'Arsip', value: ownerCounts.categoriesArchived },
              ]}
              href={ROUTES.ADMIN_CATEGORIES}
              linkLabel="Atur"
            />
            <StatCard
              label={ADMIN_CATALOG_COPY.OVERVIEW.CARDS.OFFERS_SOLD_OUT}
              value={ownerCounts.soldOutOffers}
              icon={<AlertCircle size={16} strokeWidth={1.75} />}
              badgeTone={ownerCounts.soldOutOffers > 0 ? 'accent' : 'success'}
              badgeText={
                ownerCounts.soldOutOffers > 0
                  ? 'Perlu pantauan stok'
                  : 'Semua SKU tersedia'
              }
              metaItems={[
                {
                  label: ADMIN_CATALOG_COPY.OVERVIEW.CARDS.BRANCHES_ACTIVE,
                  value: ownerCounts.activeBranches,
                },
              ]}
              href={ROUTES.ADMIN_AVAILABILITY}
              linkLabel="Cek Stok"
            />
            <StatCard
              label={ADMIN_CATALOG_COPY.OVERVIEW.CARDS.PROMOTIONS_ACTIVE}
              value={ownerCounts.activePromotions}
              icon={<Megaphone size={16} strokeWidth={1.75} />}
              badgeTone="neutral"
              badgeText="Promo & banner berjalan"
              metaItems={[
                {
                  label: ADMIN_CATALOG_COPY.OVERVIEW.CARDS.SESSIONS_UPCOMING,
                  value: ownerCounts.upcomingSessions,
                },
              ]}
              href={ROUTES.ADMIN_PROMOTIONS}
              linkLabel="Kelola"
            />
          </div>

          <AdminQuickActionsCard isOwner />
        </>
      ) : staffCounts ? (
        <>
          <div className="admin-overview-grid admin-overview-grid--staff">
            <StatCard
              label={ADMIN_CATALOG_COPY.OVERVIEW.CARDS.STAFF_AVAILABLE_OFFERS}
              value={staffCounts.availableOffers}
              icon={<CheckCircle2 size={16} strokeWidth={1.75} />}
              badgeTone="success"
              badgeText={overview.branchName ?? 'Cabang'}
              href={ROUTES.ADMIN_AVAILABILITY}
              linkLabel="Kelola Stok"
            />
            <StatCard
              label={ADMIN_CATALOG_COPY.OVERVIEW.CARDS.STAFF_SOLDOUT_OFFERS}
              value={staffCounts.soldOutOffers}
              icon={<Store size={16} strokeWidth={1.75} />}
              badgeTone={staffCounts.soldOutOffers > 0 ? 'accent' : 'success'}
              badgeText={
                staffCounts.soldOutOffers > 0
                  ? 'Perlu pantauan stok'
                  : 'Semua SKU tersedia'
              }
              href={ROUTES.ADMIN_AVAILABILITY}
              linkLabel="Perbarui"
            />
            <StatCard
              label={ADMIN_CATALOG_COPY.OVERVIEW.CARDS.STAFF_UPCOMING_SESSIONS}
              value={staffCounts.upcomingSessions}
              icon={<GraduationCap size={16} strokeWidth={1.75} />}
              badgeTone="neutral"
              badgeText="Status terjadwal"
              href={ROUTES.ADMIN_CLASSES}
              linkLabel="Lihat Jadwal"
            />
          </div>

          <AdminQuickActionsCard isOwner={false} />
        </>
      ) : null}
    </section>
  );
}
