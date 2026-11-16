import type { Metadata } from 'next';
import {
  Barlow_Condensed,
  Fraunces,
  Plus_Jakarta_Sans,
} from 'next/font/google';

import { getPublicEnvironment } from '@/config';
import { getServerEnvironment } from '@/config/environment.server';
import { APP, ROUTES } from '@/constants';
import { SEO_DEFAULTS } from '@/constants/seo.constant';
import { FOUNDATION_COPY } from '@/constants/ui.constant';
import { ReactQueryProvider, ToastProvider } from '@/providers';
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

const publicEnv = getPublicEnvironment();
const isNoIndex = isNoIndexDeployment({
  siteUrl: publicEnv.NEXT_PUBLIC_SITE_URL,
  demoMode: publicEnv.NEXT_PUBLIC_DEMO_MODE,
});

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.NEXT_PUBLIC_SITE_URL),
  applicationName: APP.NAME,
  title: {
    default: APP.NAME,
    template: `%s | ${APP.NAME}`,
  },
  alternates: { canonical: ROUTES.HOME },
  description: FOUNDATION_COPY.META,
  keywords: [...SEO_DEFAULTS.KEYWORDS],
  authors: [{ name: APP.NAME }],
  creator: APP.NAME,
  publisher: APP.NAME,
  openGraph: {
    type: 'website',
    locale: SEO_DEFAULTS.LOCALE,
    siteName: APP.NAME,
    title: APP.NAME,
    description: FOUNDATION_COPY.META,
    images: [{ url: SEO_DEFAULTS.DEFAULT_OG_IMAGE, alt: APP.NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: APP.NAME,
    description: FOUNDATION_COPY.META,
    images: [SEO_DEFAULTS.DEFAULT_OG_IMAGE],
  },
  robots: isNoIndex
    ? { index: false, follow: false }
    : {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-image-preview': 'large',
          'max-snippet': -1,
          'max-video-preview': -1,
        },
      },
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
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        {getPublicEnvironment().NEXT_PUBLIC_DEMO_MODE ? <DemoBanner /> : null}
        <ReactQueryProvider>
          <ToastProvider>{children}</ToastProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
