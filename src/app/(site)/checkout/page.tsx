import type { Metadata } from 'next';
import { connection } from 'next/server';
import { CheckoutView } from '@/components/checkout/checkout-view';
import { CHECKOUT_COPY } from '@/constants/checkout.constant';
import { ROUTES } from '@/constants/routes.constant';

export const metadata: Metadata = {
  title: `${CHECKOUT_COPY.PAGE_TITLE} · Resep Oma Kueh`,
  description: CHECKOUT_COPY.PAGE_DESCRIPTION,
  alternates: { canonical: ROUTES.CHECKOUT },
};

export default async function CheckoutPage() {
  await connection();
  return <CheckoutView />;
}
