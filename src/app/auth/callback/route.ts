import { NextResponse } from 'next/server';

import { ROUTES } from '@/constants/routes.constant';
import {
  applyAuthResponseMetadata,
  createCookieCarrierResponse,
} from '@/features/auth/http.server';
import { completeAuthCallback } from '@/features/auth/service.server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const carrier = createCookieCarrierResponse();

  const authError = url.searchParams.get('error');
  const errorCode = url.searchParams.get('error_code');
  if (authError || errorCode) {
    const reason =
      errorCode === 'otp_expired' ? 'recovery_expired' : 'recovery_invalid';
    const failUrl = new URL(
      `${ROUTES.ADMIN_LOGIN}?error=${reason}`,
      url.origin,
    );
    return applyAuthResponseMetadata(
      carrier,
      NextResponse.redirect(failUrl, 307),
    );
  }

  const outcome = await completeAuthCallback({
    code: url.searchParams.get('code'),
    tokenHash: url.searchParams.get('token_hash'),
    type: url.searchParams.get('type'),
    next: url.searchParams.get('next'),
    carrier,
  });

  if (!outcome.ok) {
    const failUrl = new URL(
      `${ROUTES.ADMIN_LOGIN}?error=${encodeURIComponent(outcome.reason)}`,
      url.origin,
    );
    return applyAuthResponseMetadata(
      carrier,
      NextResponse.redirect(failUrl, 307),
    );
  }

  const targetUrl = new URL(outcome.redirectTo, url.origin);
  return applyAuthResponseMetadata(
    carrier,
    NextResponse.redirect(targetUrl, 307),
  );
}
