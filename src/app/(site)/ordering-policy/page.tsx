import type { Metadata } from 'next';
import { connection } from 'next/server';
import { LegalPolicyView } from '@/components/content/legal-policy-view';
import { PAGE_METADATA } from '@/constants/content.constant';
import { ROUTES } from '@/constants/routes.constant';
import { getInitialPublicContent } from '@/features/content/service.server';

export const metadata: Metadata = {
  title: PAGE_METADATA.ORDERING_POLICY.title,
  description: PAGE_METADATA.ORDERING_POLICY.description,
  alternates: { canonical: ROUTES.ORDERING_POLICY },
};

export default async function OrderingPolicyPage() {
  await connection();
  const initial = await getInitialPublicContent(['legal.ordering_policy']);
  return (
    <LegalPolicyView policyKey="legal.ordering_policy" initial={initial} />
  );
}
