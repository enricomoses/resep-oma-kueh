import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';
import SiteLoading from '../loading';
import { LegalPolicyView } from '@/components/common/content/legal-policy-view';
import { PAGE_METADATA } from '@/constants/content.constant';
import { ROUTES } from '@/constants/routes.constant';
import { getInitialPublicContent } from '@/features/content/service.server';
import { buildPageMetadata } from '@/utils/seo';

export const metadata: Metadata = buildPageMetadata({
  title: PAGE_METADATA.ORDERING_POLICY.title,
  description: PAGE_METADATA.ORDERING_POLICY.description,
  path: ROUTES.ORDERING_POLICY,
});

async function OrderingPolicyContent() {
  await connection();
  const initial = await getInitialPublicContent(['legal.ordering_policy']);
  return (
    <LegalPolicyView policyKey="legal.ordering_policy" initial={initial} />
  );
}

export default function OrderingPolicyPage() {
  return (
    <Suspense fallback={<SiteLoading />}>
      <OrderingPolicyContent />
    </Suspense>
  );
}
