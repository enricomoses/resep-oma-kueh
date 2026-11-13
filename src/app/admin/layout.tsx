import type { Metadata } from 'next';
import { Suspense } from 'react';
import type { ReactNode } from 'react';

import { AUTH_COPY } from '@/constants/auth.constant';

export const metadata: Metadata = {
  title: AUTH_COPY.ADMIN_META_TITLE,
  robots: { index: false, follow: false },
};

interface AdminRootLayoutProps {
  children: ReactNode;
}

export default function AdminRootLayout({ children }: AdminRootLayoutProps) {
  return (
    <main className="admin-root-main">
      <Suspense
        fallback={
          <div className="admin-auth-page">
            <div className="content-container admin-auth-container">
              <p className="admin-auth-subtitle">Memuat portal admin…</p>
            </div>
          </div>
        }
      >
        {children}
      </Suspense>
    </main>
  );
}
