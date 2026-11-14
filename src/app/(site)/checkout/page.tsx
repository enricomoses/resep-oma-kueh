import type { Metadata } from 'next';
import { connection } from 'next/server';
import { CheckoutView } from './_components/checkout-view';
import { CHECKOUT_COPY } from '@/constants/checkout.constant';
import { ROUTES } from '@/constants/routes.constant';
import { buildPageMetadata } from '@/utils/seo';

export const metadata: Metadata = buildPageMetadata({
  title: `${CHECKOUT_COPY.PAGE_TITLE} · Resep Oma Kueh`,
  description: CHECKOUT_COPY.PAGE_DESCRIPTION,
  path: ROUTES.CHECKOUT,
  noIndex: true,
});

export default async function CheckoutPage() {
  await connection();
  return <CheckoutView />;
}
