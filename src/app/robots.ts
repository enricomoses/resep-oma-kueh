import type { MetadataRoute } from 'next';

import { getPublicEnvironment } from '@/config/environment.client';
import { ROBOTS_DISALLOW_PATHS } from '@/constants/seo.constant';
import { isNoIndexDeployment } from '@/utils/seo';

export default function robots(): MetadataRoute.Robots {
  const { NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_DEMO_MODE } =
    getPublicEnvironment();
  const noIndex = isNoIndexDeployment({
    siteUrl: NEXT_PUBLIC_SITE_URL,
    demoMode: NEXT_PUBLIC_DEMO_MODE,
  });

  if (noIndex) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [...ROBOTS_DISALLOW_PATHS],
    },
    sitemap: new URL('/sitemap.xml', NEXT_PUBLIC_SITE_URL).toString(),
  };
}
