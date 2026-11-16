import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { ProductDetailView } from './_components/product-detail-view';
import SiteLoading from '../../loading';
import { StructuredDataScript } from '@/components/common/structured-data-script';
import { getPublicEnvironment } from '@/config/environment.client';
import {
  CATALOG_QUERY_PARAMS,
  PRODUCT_DETAIL_COPY,
} from '@/constants/catalog.constant';
import { ROUTES } from '@/constants/routes.constant';
import {
  pickApprovedPrimaryProductImage,
  readPublishedProductBySlug,
} from '@/features/catalog/repository.server';
import { getProductDetail } from '@/features/catalog/service.server';
import type { InitialCatalogSection, ProductDetail } from '@/types/catalog';
import { firstSearchParam } from '@/utils/branch-url';
import { buildPageMetadata } from '@/utils/seo';
import {
  buildBreadcrumbJsonLd,
  buildProductJsonLd,
} from '@/utils/structured-data';

export async function generateMetadata({
  params,
}: PageProps<'/menu/[slug]'>): Promise<Metadata> {
  await connection();
  const { slug } = await params;

  try {
    const product = await readPublishedProductBySlug(slug);
    if (
      !product ||
      product.status !== 'published' ||
      product.needs_owner_review
    ) {
      return buildPageMetadata({
        title: PRODUCT_DETAIL_COPY.METADATA_DEFAULT_TITLE,
        description: PRODUCT_DETAIL_COPY.METADATA_DEFAULT_DESCRIPTION,
        path: `${ROUTES.MENU}/${slug}`,
        noIndex: true,
      });
    }

    const { previewImageUrl } = pickApprovedPrimaryProductImage(
      product.product_images,
      product.name,
    );

    return buildPageMetadata({
      title: `${product.name} | Resep Oma Kueh`,
      description:
        product.short_description ||
        product.description ||
        PRODUCT_DETAIL_COPY.METADATA_DEFAULT_DESCRIPTION,
      path: `${ROUTES.MENU}/${product.slug}`,
      imageUrl: previewImageUrl,
    });
  } catch {
    return buildPageMetadata({
      title: PRODUCT_DETAIL_COPY.METADATA_DEFAULT_TITLE,
      description: PRODUCT_DETAIL_COPY.METADATA_DEFAULT_DESCRIPTION,
      path: `${ROUTES.MENU}/${slug}`,
      noIndex: true,
    });
  }
}

async function MenuDetailContent({
  params,
  searchParams,
}: Pick<PageProps<'/menu/[slug]'>, 'params' | 'searchParams'>) {
  await connection();
  const { slug } = await params;
  const resolvedParams = await searchParams;
  const branch = firstSearchParam(resolvedParams[CATALOG_QUERY_PARAMS.BRANCH]);

  let initialDetail: InitialCatalogSection<ProductDetail>;

  try {
    const product = await getProductDetail({ slug, branch });
    if (!product) {
      notFound();
    }
    initialDetail = { status: 'success', data: product };
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'digest' in error &&
      (error as { digest: string }).digest === 'NEXT_NOT_FOUND'
    ) {
      throw error;
    }
    initialDetail = { status: 'error' };
  }

  const siteUrl = getPublicEnvironment().NEXT_PUBLIC_SITE_URL;
  const productJsonLd =
    initialDetail.status === 'success'
      ? buildProductJsonLd({
          siteUrl,
          product: initialDetail.data,
        })
      : null;
  const breadcrumbJsonLd =
    initialDetail.status === 'success'
      ? buildBreadcrumbJsonLd({
          siteUrl,
          items: [
            { name: 'Beranda', path: ROUTES.HOME },
            { name: 'Menu', path: ROUTES.MENU },
            {
              name: initialDetail.data.name,
              path: `${ROUTES.MENU}/${initialDetail.data.slug}`,
            },
          ],
        })
      : null;

  return (
    <>
      <StructuredDataScript data={productJsonLd} />
      <StructuredDataScript data={breadcrumbJsonLd} />
      <ProductDetailView slug={slug} initial={initialDetail} />
    </>
  );
}

export default function MenuDetailPage({
  params,
  searchParams,
}: PageProps<'/menu/[slug]'>) {
  return (
    <Suspense fallback={<SiteLoading />}>
      <MenuDetailContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
