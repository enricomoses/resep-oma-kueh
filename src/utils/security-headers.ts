export interface SecurityHeaderOptions {
  isProduction: boolean;
  siteUrl?: string;
  supabaseUrl?: string;
}

export interface HttpHeaderEntry {
  key: string;
  value: string;
}

function resolveOrigin(rawUrl: string | undefined): {
  httpOrigin: string | null;
  wsOrigin: string | null;
  isHttps: boolean;
} {
  if (!rawUrl) {
    return { httpOrigin: null, wsOrigin: null, isHttps: false };
  }
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return { httpOrigin: null, wsOrigin: null, isHttps: false };
    }
    const wsProtocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
    return {
      httpOrigin: parsed.origin,
      wsOrigin: `${wsProtocol}//${parsed.host}`,
      isHttps: parsed.protocol === 'https:',
    };
  } catch {
    return { httpOrigin: null, wsOrigin: null, isHttps: false };
  }
}

export function buildContentSecurityPolicy({
  isProduction,
  siteUrl,
  supabaseUrl,
}: SecurityHeaderOptions): string {
  const supabaseOrigin = resolveOrigin(supabaseUrl);
  const siteOrigin = resolveOrigin(siteUrl);

  const imgSources = new Set<string>([
    "'self'",
    'data:',
    'blob:',
    'https://*.supabase.co',
  ]);
  const connectSources = new Set<string>([
    "'self'",
    'https://*.supabase.co',
    'wss://*.supabase.co',
  ]);

  if (supabaseOrigin.httpOrigin) {
    imgSources.add(supabaseOrigin.httpOrigin);
    connectSources.add(supabaseOrigin.httpOrigin);
  }
  if (supabaseOrigin.wsOrigin) {
    connectSources.add(supabaseOrigin.wsOrigin);
  }

  const scriptSources = isProduction
    ? ["'self'", "'unsafe-inline'"]
    : ["'self'", "'unsafe-inline'", "'unsafe-eval'"];

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    `script-src ${scriptSources.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    `img-src ${Array.from(imgSources).join(' ')}`,
    `connect-src ${Array.from(connectSources).join(' ')}`,
  ];

  if (isProduction && siteOrigin.isHttps) {
    directives.push('upgrade-insecure-requests');
  }

  return directives.join('; ');
}

export function buildSecurityHeaders(
  options: SecurityHeaderOptions,
): HttpHeaderEntry[] {
  const siteOrigin = resolveOrigin(options.siteUrl);
  const headers: HttpHeaderEntry[] = [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    {
      key: 'Referrer-Policy',
      value: 'strict-origin-when-cross-origin',
    },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=()',
    },
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
    {
      key: 'Content-Security-Policy',
      value: buildContentSecurityPolicy(options),
    },
  ];

  if (options.isProduction && siteOrigin.isHttps) {
    headers.push({
      key: 'Strict-Transport-Security',
      value: 'max-age=31536000; includeSubDomains',
    });
  }

  return headers;
}

export const NO_STORE_HEADERS: HttpHeaderEntry[] = [
  {
    key: 'Cache-Control',
    value: 'no-store, no-cache, must-revalidate, private',
  },
  { key: 'Pragma', value: 'no-cache' },
  { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
];

export const NO_INDEX_API_HEADERS: HttpHeaderEntry[] = [
  { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
];
