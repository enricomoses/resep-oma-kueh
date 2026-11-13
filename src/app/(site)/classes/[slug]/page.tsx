import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';

import {
  ClassDetailView,
  type InitialPublicClassDetail,
} from '@/components/classes/class-detail-view';
import { CATALOG_QUERY_PARAMS } from '@/constants/catalog.constant';
import { CLASSES_COPY } from '@/constants/classes.constant';
import { PublicClassNotFoundError } from '@/features/classes/errors.server';
import { getPublicClassDetail } from '@/features/classes/service.server';

function firstParam(value: string | string[] | undefined): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<'/classes/[slug]'>): Promise<Metadata> {
  await connection();
  const { slug } = await params;
  const resolvedParams = await searchParams;
  const branch = firstParam(resolvedParams[CATALOG_QUERY_PARAMS.BRANCH]);

  try {
    const detail = await getPublicClassDetail(slug, { branch });
    return {
      title: `${detail.program.title} | ROK Baking Class`,
      description:
        detail.program.shortDescription ??
        detail.program.description.slice(0, 155),
    };
  } catch {
    return {
      title: 'ROK Baking Class | Resep Oma Kueh',
      description: CLASSES_COPY.SUBTITLE,
    };
  }
}

export default async function ClassDetailPage({
  params,
  searchParams,
}: PageProps<'/classes/[slug]'>) {
  await connection();
  const { slug } = await params;
  const resolvedParams = await searchParams;
  const branch = firstParam(resolvedParams[CATALOG_QUERY_PARAMS.BRANCH]);

  let initial: InitialPublicClassDetail;
  try {
    const data = await getPublicClassDetail(slug, { branch });
    initial = { status: 'success', data };
  } catch (err) {
    if (err instanceof PublicClassNotFoundError) {
      notFound();
    }
    initial = { status: 'error' };
  }

  return <ClassDetailView slug={slug} initial={initial} />;
}
