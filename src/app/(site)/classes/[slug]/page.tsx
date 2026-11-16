import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { ClassDetailView } from './_components/class-detail-view';
import SiteLoading from '../../loading';
import { StructuredDataScript } from '@/components/common/structured-data-script';
import { getPublicEnvironment } from '@/config/environment.client';
import { CATALOG_QUERY_PARAMS } from '@/constants/catalog.constant';
import { CLASSES_COPY } from '@/constants/classes.constant';
import { ROUTES } from '@/constants/routes.constant';
import { PublicClassNotFoundError } from '@/features/classes/errors.server';
import { getPublicClassDetail } from '@/features/classes/service.server';
import type { InitialPublicClassDetail } from '@/types/classes';
import { firstSearchParam } from '@/utils/branch-url';
import { buildPageMetadata } from '@/utils/seo';
import {
  buildBreadcrumbJsonLd,
  buildClassEventJsonLd,
} from '@/utils/structured-data';

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<'/classes/[slug]'>): Promise<Metadata> {
  await connection();
  const { slug } = await params;
  const resolvedParams = await searchParams;
  const branch = firstSearchParam(resolvedParams[CATALOG_QUERY_PARAMS.BRANCH]);

  try {
    const detail = await getPublicClassDetail(slug, { branch });
    return buildPageMetadata({
      title: `${detail.program.title} | Resep Oma Kueh`,
      description:
        detail.program.shortDescription ??
        detail.program.description.slice(0, 155),
      path: `${ROUTES.CLASSES}/${detail.program.slug}`,
      imageUrl: detail.program.coverImageUrl,
    });
  } catch {
    return buildPageMetadata({
      title: 'ROK Baking Class | Resep Oma Kueh',
      description: CLASSES_COPY.SUBTITLE,
      path: `${ROUTES.CLASSES}/${slug}`,
      noIndex: true,
    });
  }
}

async function ClassDetailContent({
  params,
  searchParams,
}: Pick<PageProps<'/classes/[slug]'>, 'params' | 'searchParams'>) {
  await connection();
  const { slug } = await params;
  const resolvedParams = await searchParams;
  const branch = firstSearchParam(resolvedParams[CATALOG_QUERY_PARAMS.BRANCH]);

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

  const siteUrl = getPublicEnvironment().NEXT_PUBLIC_SITE_URL;
  const eventJsonLd =
    initial.status === 'success'
      ? buildClassEventJsonLd({
          siteUrl,
          program: initial.data.program,
          evaluatedAtIso: initial.data.evaluatedAtUtc,
        })
      : null;
  const breadcrumbJsonLd =
    initial.status === 'success'
      ? buildBreadcrumbJsonLd({
          siteUrl,
          items: [
            { name: 'Beranda', path: ROUTES.HOME },
            { name: 'ROK Baking Class', path: ROUTES.CLASSES },
            {
              name: initial.data.program.title,
              path: `${ROUTES.CLASSES}/${initial.data.program.slug}`,
            },
          ],
        })
      : null;

  return (
    <>
      <StructuredDataScript data={eventJsonLd} />
      <StructuredDataScript data={breadcrumbJsonLd} />
      <ClassDetailView slug={slug} initial={initial} />
    </>
  );
}

export default function ClassDetailPage({
  params,
  searchParams,
}: PageProps<'/classes/[slug]'>) {
  return (
    <Suspense fallback={<SiteLoading />}>
      <ClassDetailContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
