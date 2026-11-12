import { Suspense } from 'react';
import type { ReactNode } from 'react';
import { connection } from 'next/server';
import { getInitialBranches } from '@/features/branches/service.server';
import { APPROVED_CONTACTS } from '@/features/branches/contacts.server';
import { BranchProvider } from '@/providers/branch-provider';
import { SiteHeader } from '@/components/site/site-header';
import { SiteFooter } from '@/components/site/site-footer';
import { ChatSlot } from '@/components/site/chat-slot';
import { SITE_COPY } from '@/constants/site.constant';
import { getPublicEnvironment } from '@/config';

interface SiteContentProps {
  children: ReactNode;
}
async function SiteContent({ children }: SiteContentProps) {
  await connection();
  const initial = await getInitialBranches();
  return (
    <BranchProvider initial={initial}>
      <a className="site-skip" href={`#${SITE_COPY.MAIN_ID}`}>
        {SITE_COPY.SKIP}
      </a>
      <SiteHeader />
      {children}
      <SiteFooter
        contacts={APPROVED_CONTACTS}
        initialUnavailable={initial.status === 'error'}
      />
      {getPublicEnvironment().NEXT_PUBLIC_CHAT_WIDGET_ENABLED ? (
        <ChatSlot />
      ) : null}
    </BranchProvider>
  );
}
export default function SiteLayout({ children }: LayoutProps<'/'>) {
  return (
    <Suspense fallback={<p role="status">{SITE_COPY.HYDRATING}</p>}>
      <SiteContent>{children}</SiteContent>
    </Suspense>
  );
}
