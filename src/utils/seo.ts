import type { Metadata } from 'next';
import { getPublicEnvironment } from '@/config/environment.client';
import { ROUTES } from '@/constants/routes.constant';
import { SEO_DEFAULTS } from '@/constants/seo.constant';
import { APP } from '@/constants/app.constant';

interface NoIndexCheckOptions {
  siteUrl: string;
  demoMode: boolean;
}

export function isNoIndexDeployment(options?: NoIndexCheckOptions): boolean {
  const resolved = options ?? {
    siteUrl: getPublicEnvironment().NEXT_PUBLIC_SITE_URL,
    demoMode: getPublicEnvironment().NEXT_PUBLIC_DEMO_MODE,
  };

  if (resolved.demoMode) {
    return true;
  }

  try {
    const hostname = new URL(resolved.siteUrl).hostname.toLowerCase();
    if (
      SEO_DEFAULTS.PREVIEW_HOST_SUFFIXES.some((suffix) =>
        hostname.endsWith(suffix),
      )
    ) {
      return true;
    }
    if (
      SEO_DEFAULTS.PREVIEW_HOST_PREFIXES.some((prefix) =>
        hostname.startsWith(prefix),
      )
    ) {
      return true;
    }
  } catch {
    return true;
  }

  return false;
}

export function resolveCanonicalUrl(siteUrl: string, path: string): string {
  const base = new URL(siteUrl);
  const cleanPath =
    path === '/' ? '/' : path.replace(/\/+$/, '') || ROUTES.HOME;
  const resolved = new URL(cleanPath, base);
  resolved.search = '';
  resolved.hash = '';
  return resolved.toString();
}

export interface BuildPageMetadataInput {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
  imageUrl?: string | null;
  type?: 'website' | 'article';
  siteUrl?: string;
  demoMode?: boolean;
}

export function buildPageMetadata({
  title,
  description,
  path,
  noIndex = false,
  imageUrl,
  type = 'website',
  siteUrl,
  demoMode,
}: BuildPageMetadataInput): Metadata {
  const env =
    siteUrl !== undefined && demoMode !== undefined
      ? { siteUrl, demoMode }
      : {
          siteUrl: getPublicEnvironment().NEXT_PUBLIC_SITE_URL,
          demoMode: getPublicEnvironment().NEXT_PUBLIC_DEMO_MODE,
        };
  const canonicalUrl = resolveCanonicalUrl(env.siteUrl, path);
  const effectiveNoIndex = noIndex || isNoIndexDeployment(env);

  const validImage =
    imageUrl && /^https?:\/\//i.test(imageUrl)
      ? [{ url: imageUrl }]
      : undefined;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: APP.NAME,
      locale: SEO_DEFAULTS.LOCALE,
      type,
      ...(validImage ? { images: validImage } : {}),
    },
    twitter: {
      card: validImage ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(validImage ? { images: validImage.map((img) => img.url) } : {}),
    },
    ...(effectiveNoIndex
      ? {
          robots: {
            index: false,
            follow: false,
          },
        }
      : {}),
  };
}
