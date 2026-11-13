import type { Metadata } from 'next';
import {
  Barlow_Condensed,
  Fraunces,
  Plus_Jakarta_Sans,
} from 'next/font/google';

import { getPublicEnvironment } from '@/config';
import { getServerEnvironment } from '@/config/environment.server';
import { APP, ROUTES } from '@/constants';
import { FOUNDATION_COPY } from '@/constants/ui.constant';
import { ReactQueryProvider } from '@/providers';
import { cn } from '@/utils';
import { isNoIndexDeployment } from '@/utils/seo';

import './globals.css';
import { DemoBanner } from '@/app/_components/demo-banner';

const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  subsets: ['latin'],
});

const fraunces = Fraunces({
  variable: '--font-fraunces',
  display: 'swap',
  subsets: ['latin'],
});
const barlow = Barlow_Condensed({
  variable: '--font-barlow',
  weight: ['600'],
  subsets: ['latin'],
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(getPublicEnvironment().NEXT_PUBLIC_SITE_URL),
  title: APP.NAME,
  alternates: { canonical: ROUTES.HOME },
  description: FOUNDATION_COPY.META,
  robots: isNoIndexDeployment() ? { index: false, follow: false } : undefined,
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  getServerEnvironment();
  return (
    <html
      lang="id"
      className={cn(
        jakarta.variable,
        fraunces.variable,
        barlow.variable,
        'h-full antialiased',
      )}
    >
      <body className="flex min-h-full flex-col">
        {getPublicEnvironment().NEXT_PUBLIC_DEMO_MODE ? <DemoBanner /> : null}
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </body>
    </html>
  );
}
