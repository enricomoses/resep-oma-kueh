import type { NextConfig } from 'next';
import {
  NO_INDEX_API_HEADERS,
  NO_STORE_HEADERS,
  buildSecurityHeaders,
} from './src/utils/security-headers';

function buildRemotePatterns(): NonNullable<
  NextConfig['images']
>['remotePatterns'] {
  const patterns: NonNullable<NextConfig['images']>['remotePatterns'] = [
    {
      protocol: 'https',
      hostname: '**.supabase.co',
    },
  ];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    try {
      const parsed = new URL(supabaseUrl);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        patterns.push({
          protocol: parsed.protocol.replace(':', '') as 'http' | 'https',
          hostname: parsed.hostname,
          ...(parsed.port ? { port: parsed.port } : {}),
        });
      }
    } catch {
      // Invalid env URL is handled by environment schema validation.
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    patterns.push(
      { protocol: 'http', hostname: '127.0.0.1' },
      { protocol: 'http', hostname: 'localhost' },
    );
  }

  return patterns;
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: buildRemotePatterns(),
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== 'production',
  },
  async headers() {
    const securityHeaders = buildSecurityHeaders({
      isProduction: process.env.NODE_ENV === 'production',
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    });

    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        source: '/admin/:path*',
        headers: NO_STORE_HEADERS,
      },
      {
        source: '/auth/:path*',
        headers: NO_STORE_HEADERS,
      },
      {
        source: '/cart',
        headers: NO_STORE_HEADERS,
      },
      {
        source: '/checkout',
        headers: NO_STORE_HEADERS,
      },
      {
        source: '/api/:path*',
        headers: NO_INDEX_API_HEADERS,
      },
    ];
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
