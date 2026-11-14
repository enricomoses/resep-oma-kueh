import type { Metadata } from 'next';
import { connection } from 'next/server';

import { ClassesView } from './_components/classes-view';
import { CATALOG_QUERY_PARAMS } from '@/constants/catalog.constant';
import { CLASSES_COPY } from '@/constants/classes.constant';
import { ROUTES } from '@/constants/routes.constant';
import { getPublicClassesDirectory } from '@/features/classes/service.server';
import type { InitialPublicClasses } from '@/types/classes';
import { firstSearchParam } from '@/utils/branch-url';
import { buildPageMetadata } from '@/utils/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'ROK Baking Class | Resep Oma Kueh',
  description: CLASSES_COPY.SUBTITLE,
  path: ROUTES.CLASSES,
});

export default async function ClassesPage({
  searchParams,
}: PageProps<'/classes'>) {
  await connection();
  const resolvedParams = await searchParams;
  const branch = firstSearchParam(resolvedParams[CATALOG_QUERY_PARAMS.BRANCH]);

  let initial: InitialPublicClasses;
  try {
    const data = await getPublicClassesDirectory({ branch });
    initial = { status: 'success', data };
  } catch {
    initial = { status: 'error' };
  }

  return <ClassesView initial={initial} />;
}
