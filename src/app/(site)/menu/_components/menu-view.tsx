'use client';

import { SlidersHorizontal } from 'lucide-react';

import { PageHeader } from '@/components/common/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Drawer } from '@/components/ui/drawer';
import type { serializeCatalogQueryKey } from '@/constants/catalog.constant';
import {
  CATALOG_COPY,
  CATALOG_QUERY_PARAMS,
} from '@/constants/catalog.constant';
import { SITE_COPY } from '@/constants/site.constant';
import type { InitialCatalogSection } from '@/hooks/use-catalog';
import { useMenuFilters } from '@/hooks/use-menu-filters';
import type {
  CatalogDirectory,
  PublicCategoryDirectory,
} from '@/types/catalog';
import { cn } from '@/utils';

import { MenuFilterPanel } from './menu-filter-panel';
import { MenuResultsSection } from './menu-results-section';

interface MenuViewProps {
  initialCategories: InitialCatalogSection<PublicCategoryDirectory>;
  initialCatalog: {
    key: ReturnType<typeof serializeCatalogQueryKey>;
    result: InitialCatalogSection<CatalogDirectory>;
  };
  className?: string;
}

export function MenuView({
  initialCategories,
  initialCatalog,
  className,
}: MenuViewProps) {
  const menu = useMenuFilters({ initialCategories, initialCatalog });

  const renderFilterPanel = (idPrefix: string) => (
    <MenuFilterPanel
      idPrefix={idPrefix}
      categories={menu.categories}
      hasBranchSelected={menu.hasBranchSelected}
      filters={menu.filterState}
      priceError={menu.priceError}
      onSearchDraftChange={menu.setSearchDraft}
      onCategoryChange={(value) =>
        menu.updateUrlParams({
          [CATALOG_QUERY_PARAMS.CATEGORY]: value || null,
        })
      }
      onTagChange={(value) =>
        menu.updateUrlParams({
          [CATALOG_QUERY_PARAMS.TAG]: value || null,
        })
      }
      onAvailabilityChange={(value) =>
        menu.updateUrlParams({
          [CATALOG_QUERY_PARAMS.AVAILABILITY]: value || null,
        })
      }
      onMinPriceDraftChange={menu.setMinPriceDraft}
      onMaxPriceDraftChange={menu.setMaxPriceDraft}
      onApplyPriceRange={menu.handleApplyPriceRange}
      onSortChange={(value) =>
        menu.updateUrlParams({
          [CATALOG_QUERY_PARAMS.SORT]: value,
        })
      }
      onResetFilters={menu.handleResetFilters}
    />
  );

  return (
    <main
      id={SITE_COPY.MAIN_ID}
      tabIndex={-1}
      className={cn('content-container menu-page-main', className)}
    >
      <section className="menu-header-section" aria-labelledby="menu-title">
        <PageHeader
          className="content-header-block"
          titleId="menu-title"
          titleClassName="editorial-display"
          subtitleClassName="editorial-lead"
          badges={<Badge tone="accent">{CATALOG_COPY.EYEBROW}</Badge>}
          title={CATALOG_COPY.TITLE}
          subtitle={CATALOG_COPY.SUBTITLE}
        />

        {!menu.hasBranchSelected ? (
          <Card tone="cream" className="menu-branch-notice-card">
            <h2>{CATALOG_COPY.BRANCH_NOTICE_TITLE}</h2>
            <p>{CATALOG_COPY.BRANCH_NOTICE_BODY}</p>
          </Card>
        ) : null}
      </section>

      <section
        className="menu-catalog-section"
        aria-label={CATALOG_COPY.FILTER_TITLE}
      >
        <div className="menu-toolbar-mobile">
          <Button
            variant="secondary"
            onClick={() => menu.setMobileFilterOpen(true)}
            aria-haspopup="dialog"
          >
            <SlidersHorizontal size={18} aria-hidden="true" />
            {CATALOG_COPY.OPEN_FILTERS_MOBILE}
          </Button>
          {menu.catalogData ? (
            <p className="menu-result-summary" aria-live="polite">
              {CATALOG_COPY.RESULT_SUMMARY(
                menu.catalogData.items.length,
                menu.catalogData.total,
              )}
            </p>
          ) : null}
        </div>

        <div className="menu-layout-grid">
          <aside
            className="menu-sidebar-desktop"
            aria-label={CATALOG_COPY.FILTER_TITLE}
          >
            <Card className="menu-filter-card">
              <h2 className="menu-filter-heading">
                {CATALOG_COPY.FILTER_TITLE}
              </h2>
              {renderFilterPanel('desktop')}
            </Card>
          </aside>

          <MenuResultsSection
            catalogData={menu.catalogData}
            isCatalogError={menu.isCatalogError}
            hasBranchSelected={menu.hasBranchSelected}
            branchCode={menu.displayBranchCode}
            onRetry={menu.handleRetryCatalog}
            onResetFilters={menu.handleResetFilters}
            onPageChange={(nextPage) =>
              menu.updateUrlParams(
                {
                  [CATALOG_QUERY_PARAMS.PAGE]:
                    nextPage <= 1 ? null : String(nextPage),
                },
                false,
              )
            }
          />
        </div>
      </section>

      <Drawer
        open={menu.mobileFilterOpen}
        onOpenChange={menu.setMobileFilterOpen}
        title={CATALOG_COPY.FILTER_TITLE}
      >
        <div className="menu-mobile-drawer-body">
          {renderFilterPanel('mobile')}
          <Button onClick={() => menu.setMobileFilterOpen(false)}>
            {CATALOG_COPY.CLOSE_FILTERS_MOBILE}
          </Button>
        </div>
      </Drawer>
    </main>
  );
}
