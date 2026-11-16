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

  if (process.env.VERCEL_ENV === 'preview') {
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
    if (
      SEO_DEFAULTS.PREVIEW_HOST_SUBSTRINGS.some((part) =>
        hostname.includes(part),
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

function resolveOgImageUrl(
  siteUrl: string,
  imageUrl?: string | null,
): string | null {
  const candidate = imageUrl?.trim();
  if (candidate) {
    if (/^https?:\/\//i.test(candidate)) {
      return candidate;
    }
    if (candidate.startsWith('/')) {
      return resolveCanonicalUrl(siteUrl, candidate);
    }
  }

  return resolveCanonicalUrl(siteUrl, SEO_DEFAULTS.DEFAULT_OG_IMAGE);
}

function formatMetadataTitles(
  title: string,
  path: string,
): {
  documentTitle: Metadata['title'];
  socialTitle: string;
} {
  if (path === ROUTES.HOME || title.trim() === APP.NAME) {
    return {
      documentTitle: { absolute: APP.NAME },
      socialTitle: APP.NAME,
    };
  }

  const baseTitle = title
    .replace(new RegExp(`\\s*\\|\\s*${APP.NAME}$`, 'i'), '')
    .trim();

  if (!baseTitle) {
    return {
      documentTitle: { absolute: APP.NAME },
      socialTitle: APP.NAME,
    };
  }

  return {
    documentTitle: baseTitle,
    socialTitle: `${baseTitle} | ${APP.NAME}`,
  };
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
  const { documentTitle, socialTitle } = formatMetadataTitles(title, path);
  const resolvedImageUrl = resolveOgImageUrl(env.siteUrl, imageUrl);
  const validImage = resolvedImageUrl
    ? [{ url: resolvedImageUrl, alt: socialTitle }]
    : undefined;

  return {
    title: documentTitle,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: socialTitle,
      description,
      url: canonicalUrl,
      siteName: APP.NAME,
      locale: SEO_DEFAULTS.LOCALE,
      type,
      ...(validImage ? { images: validImage } : {}),
    },
    twitter: {
      card: validImage ? 'summary_large_image' : 'summary',
      title: socialTitle,
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
