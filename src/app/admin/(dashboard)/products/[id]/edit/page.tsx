import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { AdminForbiddenPanel } from '../../../_components/admin-forbidden-panel';
import { AdminProductEditorSkeleton } from '../../../../_components/skeletons/admin-product-editor-skeleton';
import { AdminProductEditorView } from './_components/admin-product-editor-view';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { getAdminProductEditorAggregate } from '@/features/admin-catalog/configuration.server';
import { AdminCatalogNotFoundError } from '@/features/admin-catalog/errors.server';
import { parseUuidRouteParam } from '@/features/admin-catalog/http.server';
import { requireAdminSession } from '@/features/auth/admin-guard.server';
import { AuthInvalidRequestError } from '@/features/auth/errors.server';
import { buildAdminProductEditRoute } from '@/utils/admin-catalog';

interface AdminEditProductPageProps {
  params: Promise<{ id: string }>;
}

export const instant = false;

export const metadata: Metadata = {
  title: `${ADMIN_CATALOG_COPY.PRODUCT_EDITOR.EDIT_PAGE_TITLE} · Admin Resep Oma Kueh`,
  robots: { index: false, follow: false },
};

async function AdminEditProductContent({ params }: AdminEditProductPageProps) {
  await connection();
  const { id } = await params;
  const profile = await requireAdminSession(buildAdminProductEditRoute(id));
  if (profile.role !== 'owner') {
    return <AdminForbiddenPanel />;
  }

  let productId: string;
  try {
    productId = parseUuidRouteParam(id);
  } catch (err) {
    if (err instanceof AuthInvalidRequestError) {
      notFound();
    }
    throw err;
  }

  let aggregate;
  try {
    aggregate = await getAdminProductEditorAggregate(profile, productId);
  } catch (err) {
    if (err instanceof AdminCatalogNotFoundError) {
      notFound();
    }
    throw err;
  }

  return (
    <AdminProductEditorView
      profile={profile}
      productId={productId}
      initialAggregate={aggregate}
    />
  );
}

export default function AdminEditProductPage({
  params,
}: AdminEditProductPageProps) {
  return (
    <Suspense fallback={<AdminProductEditorSkeleton />}>
      <AdminEditProductContent params={params} />
    </Suspense>
  );
}
