import type { Metadata } from 'next';
import { connection } from 'next/server';
import { CartView } from './_components/cart-view';
import { CART_COPY } from '@/constants/cart.constant';
import { ROUTES } from '@/constants/routes.constant';
import { buildPageMetadata } from '@/utils/seo';

export const metadata: Metadata = buildPageMetadata({
  title: `${CART_COPY.PAGE_TITLE} · Resep Oma Kueh`,
  description: CART_COPY.PAGE_DESCRIPTION,
  path: ROUTES.CART,
  noIndex: true,
});

export default async function CartPage() {
  await connection();
  return <CartView />;
}
