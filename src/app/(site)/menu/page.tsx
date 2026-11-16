import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';
import SiteLoading from '../loading';
import { MenuView } from './_components/menu-view';
import { StructuredDataScript } from '@/components/common/structured-data-script';
import { getPublicEnvironment } from '@/config/environment.client';
import {
  CATALOG_COPY,
  serializeCatalogQueryKey,
} from '@/constants/catalog.constant';
import { ROUTES } from '@/constants/routes.constant';
import { getCatalog, getCategories } from '@/features/catalog/service.server';
import { parseCatalogSearchParams } from '@/utils/branch-url';
import { buildPageMetadata } from '@/utils/seo';
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
} from '@/utils/structured-data';

export const metadata: Metadata = buildPageMetadata({
  title: 'Menu | Resep Oma Kueh',
  description: CATALOG_COPY.SUBTITLE,
  path: ROUTES.MENU,
});

async function MenuContent({
  searchParams,
}: Pick<PageProps<'/menu'>, 'searchParams'>) {
  await connection();
  const resolvedParams = await searchParams;
  const initialQueryInput = parseCatalogSearchParams(resolvedParams);

  const [initialCategories, initialCatalogResult] = await Promise.all([
    getCategories()
      .then((data) => ({ status: 'success' as const, data }))
      .catch(() => ({ status: 'error' as const })),
    getCatalog(initialQueryInput)
      .then((data) => ({ status: 'success' as const, data }))
      .catch(() => ({ status: 'error' as const })),
  ]);

  const siteUrl = getPublicEnvironment().NEXT_PUBLIC_SITE_URL;
  const collectionJsonLd = buildCollectionPageJsonLd({
    siteUrl,
    title: 'Menu | Resep Oma Kueh',
    description: CATALOG_COPY.SUBTITLE,
    path: ROUTES.MENU,
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd({
    siteUrl,
    items: [
      { name: 'Beranda', path: ROUTES.HOME },
      { name: 'Menu', path: ROUTES.MENU },
    ],
  });

  return (
    <>
      <StructuredDataScript data={collectionJsonLd} />
      <StructuredDataScript data={breadcrumbJsonLd} />
      <MenuView
        initialCategories={initialCategories}
        initialCatalog={{
          key: serializeCatalogQueryKey(initialQueryInput),
          result: initialCatalogResult,
        }}
      />
    </>
  );
}

export default function MenuPage({ searchParams }: PageProps<'/menu'>) {
  return (
    <Suspense fallback={<SiteLoading />}>
      <MenuContent searchParams={searchParams} />
    </Suspense>
  );
}
