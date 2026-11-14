import type { Metadata } from 'next';
import { connection } from 'next/server';
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

export default async function PrivacyPage() {
  await connection();
  const initial = await getInitialPublicContent(['legal.privacy']);
  return <LegalPolicyView policyKey="legal.privacy" initial={initial} />;
}
