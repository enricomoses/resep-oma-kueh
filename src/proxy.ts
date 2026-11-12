import type { NextRequest } from 'next/server';

import { refreshAuthSession } from '@/lib/supabase/proxy';

export function proxy(request: NextRequest) {
  return refreshAuthSession(request);
}

// Next statically analyzes matcher literals. Public/chat/checkout never refresh admin cookies.
export const config = {
  matcher: [
    '/admin/:path*',
    '/auth/:path*',
    '/api/admin/:path*',
    '/api/auth/:path*',
  ],
};
