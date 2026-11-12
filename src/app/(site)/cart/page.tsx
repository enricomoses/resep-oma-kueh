import type { Metadata } from 'next';
import { connection } from 'next/server';
import { CartView } from '@/components/cart/cart-view';
import { CART_COPY } from '@/constants/cart.constant';
import { ROUTES } from '@/constants/routes.constant';

export const metadata: Metadata = {
  title: `${CART_COPY.PAGE_TITLE} · Resep Oma Kueh`,
  description: CART_COPY.PAGE_DESCRIPTION,
  alternates: { canonical: ROUTES.CART },
};

export default async function CartPage() {
  await connection();
  return <CartView />;
}
