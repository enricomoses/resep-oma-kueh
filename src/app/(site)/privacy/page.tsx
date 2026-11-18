import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { SiteLegalPolicySkeleton } from '../_components/skeletons/site-legal-policy-skeleton';
import { LegalPolicyView } from '@/components/common/content/legal-policy-view';
import { PAGE_METADATA } from '@/constants/content.constant';
import { ROUTES } from '@/constants/routes.constant';
import { getInitialPublicContent } from '@/features/content/service.server';
import { buildPageMetadata } from '@/utils/seo';

export const metadata: Metadata = buildPageMetadata({
  title: PAGE_METADATA.PRIVACY.title,
  description: PAGE_METADATA.PRIVACY.description,
  path: ROUTES.PRIVACY,
});

async function PrivacyContent() {
  await connection();
  const initial = await getInitialPublicContent(['legal.privacy']);
  return <LegalPolicyView policyKey="legal.privacy" initial={initial} />;
}

export default function PrivacyPage() {
  return (
    <Suspense fallback={<SiteLegalPolicySkeleton factCount={4} />}>
      <PrivacyContent />
    </Suspense>
  );
}
