import { Suspense } from 'react';
import type { ReactNode } from 'react';
import { connection } from 'next/server';
import { getInitialBranches } from '@/features/branches/service.server';
import { getSiteFooterMeta } from '@/features/content/service.server';
import { BranchProvider } from '@/providers/branch-provider';
import { SiteHeader } from '@/components/common/layout/site-header';
import { SiteFooter } from '@/components/common/layout/site-footer';
import { ChatSlot } from '@/components/common/chat/chat-slot';
import { SITE_COPY } from '@/constants/site.constant';
import { getPublicEnvironment } from '@/config';

interface SiteContentProps {
  children: ReactNode;
}
async function SiteContent({ children }: SiteContentProps) {
  await connection();
  const [initial, footerMeta] = await Promise.all([
    getInitialBranches(),
    getSiteFooterMeta(),
  ]);
  return (
    <BranchProvider initial={initial}>
      <a className="site-skip" href={`#${SITE_COPY.MAIN_ID}`}>
        {SITE_COPY.SKIP}
      </a>
      <SiteHeader />
      {children}
      <SiteFooter
        contacts={footerMeta.contacts}
        footerNote={footerMeta.footerNote}
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
