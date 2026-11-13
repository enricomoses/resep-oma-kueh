import type { Metadata } from 'next';
import { connection } from 'next/server';

import {
  ClassesView,
  type InitialPublicClasses,
} from '@/components/classes/classes-view';
import { CATALOG_QUERY_PARAMS } from '@/constants/catalog.constant';
import { CLASSES_COPY } from '@/constants/classes.constant';
import { getPublicClassesDirectory } from '@/features/classes/service.server';

export const metadata: Metadata = {
  title: 'ROK Baking Class | Resep Oma Kueh',
  description: CLASSES_COPY.SUBTITLE,
};

function firstParam(value: string | string[] | undefined): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
}

export default async function ClassesPage({
  searchParams,
}: PageProps<'/classes'>) {
  await connection();
  const resolvedParams = await searchParams;
  const branch = firstParam(resolvedParams[CATALOG_QUERY_PARAMS.BRANCH]);

  let initial: InitialPublicClasses;
  try {
    const data = await getPublicClassesDirectory({ branch });
    initial = { status: 'success', data };
  } catch {
    initial = { status: 'error' };
  }

  return <ClassesView initial={initial} />;
}
