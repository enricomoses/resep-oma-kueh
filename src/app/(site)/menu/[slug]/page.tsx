import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { ProductDetailView } from '@/components/catalog/product-detail-view';
import {
  CATALOG_QUERY_PARAMS,
  PRODUCT_DETAIL_COPY,
} from '@/constants/catalog.constant';
import { readPublishedProductBySlug } from '@/features/catalog/repository.server';
import { getProductDetail } from '@/features/catalog/service.server';
import type { InitialCatalogSection } from '@/hooks/use-catalog';
import type { ProductDetail } from '@/types/catalog';

function firstParam(value: string | string[] | undefined): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
}

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
      return {
        title: PRODUCT_DETAIL_COPY.METADATA_DEFAULT_TITLE,
        description: PRODUCT_DETAIL_COPY.METADATA_DEFAULT_DESCRIPTION,
      };
    }

    return {
      title: `${product.name} | Resep Oma Kueh`,
      description:
        product.short_description ||
        product.description ||
        PRODUCT_DETAIL_COPY.METADATA_DEFAULT_DESCRIPTION,
    };
  } catch {
    return {
      title: PRODUCT_DETAIL_COPY.METADATA_DEFAULT_TITLE,
      description: PRODUCT_DETAIL_COPY.METADATA_DEFAULT_DESCRIPTION,
    };
  }
}

export default async function MenuDetailPage({
  params,
  searchParams,
}: PageProps<'/menu/[slug]'>) {
  await connection();
  const { slug } = await params;
  const resolvedParams = await searchParams;
  const branch = firstParam(resolvedParams[CATALOG_QUERY_PARAMS.BRANCH]);

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

  return <ProductDetailView slug={slug} initial={initialDetail} />;
}
