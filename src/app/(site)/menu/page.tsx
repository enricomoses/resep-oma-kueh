import type { Metadata } from 'next';
import { connection } from 'next/server';
import { MenuView } from './_components/menu-view';
import {
  CATALOG_COPY,
  serializeCatalogQueryKey,
} from '@/constants/catalog.constant';
import { ROUTES } from '@/constants/routes.constant';
import { getCatalog, getCategories } from '@/features/catalog/service.server';
import { parseCatalogSearchParams } from '@/utils/branch-url';
import { buildPageMetadata } from '@/utils/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Menu & Katalog | Resep Oma Kueh',
  description: CATALOG_COPY.SUBTITLE,
  path: ROUTES.MENU,
});

export default async function MenuPage({ searchParams }: PageProps<'/menu'>) {
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

  return (
    <MenuView
      initialCategories={initialCategories}
      initialCatalog={{
        key: serializeCatalogQueryKey(initialQueryInput),
        result: initialCatalogResult,
      }}
    />
  );
}
