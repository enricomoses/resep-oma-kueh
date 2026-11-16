import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { CartView } from './_components/cart-view';
import SiteLoading from '../loading';
import { CART_COPY } from '@/constants/cart.constant';
import { ROUTES } from '@/constants/routes.constant';
import { buildPageMetadata } from '@/utils/seo';

export const metadata: Metadata = buildPageMetadata({
  title: `${CART_COPY.PAGE_TITLE} | Resep Oma Kueh`,
  description: CART_COPY.PAGE_DESCRIPTION,
  path: ROUTES.CART,
  noIndex: true,
});

async function CartContent() {
  await connection();
  return <CartView />;
}

export default function CartPage() {
  return (
    <Suspense fallback={<SiteLoading />}>
      <CartContent />
    </Suspense>
  );
}
