import 'server-only';

import { AUTH_COPY } from '@/constants/auth.constant';
import { ERROR_COPY } from '@/constants/copy.constant';
import type { ApiErrorCode } from '@/types';

export class AuthError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly fieldErrors?: Record<string, string[]>;
  readonly retryAfterSeconds?: number;

  constructor(
    message: string,
    code: ApiErrorCode,
    status: number,
    options?: {
      fieldErrors?: Record<string, string[]>;
      retryAfterSeconds?: number;
    },
  ) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.status = status;
    this.fieldErrors = options?.fieldErrors;
    this.retryAfterSeconds = options?.retryAfterSeconds;
  }
}

export class AuthUnauthenticatedError extends AuthError {
  constructor(message: string = ERROR_COPY.UNAUTHENTICATED) {
    super(message, 'UNAUTHENTICATED', 401);
    this.name = 'AuthUnauthenticatedError';
  }
}

export class AuthForbiddenError extends AuthError {
  constructor(message: string = ERROR_COPY.FORBIDDEN) {
    super(message, 'FORBIDDEN', 403);
    this.name = 'AuthForbiddenError';
  }
}

export class AuthInvalidRequestError extends AuthError {
  constructor(message: string = AUTH_COPY.ERROR_INVALID_REQUEST) {
    super(message, 'INVALID_REQUEST', 400);
    this.name = 'AuthInvalidRequestError';
  }
}

export class AuthRequestTooLargeError extends AuthError {
  constructor(message: string = AUTH_COPY.ERROR_TOO_LARGE) {
    super(message, 'REQUEST_TOO_LARGE', 413);
    this.name = 'AuthRequestTooLargeError';
  }
}

export class AuthValidationError extends AuthError {
  constructor(
    message: string = ERROR_COPY.VALIDATION_ERROR,
    fieldErrors?: Record<string, string[]>,
  ) {
    super(message, 'VALIDATION_ERROR', 422, { fieldErrors });
    this.name = 'AuthValidationError';
  }
}

export class AuthRateLimitedError extends AuthError {
  constructor(retryAfterSeconds: number) {
    super(ERROR_COPY.RATE_LIMITED, 'RATE_LIMITED', 429, { retryAfterSeconds });
    this.name = 'AuthRateLimitedError';
  }
}

export class AuthUpstreamError extends AuthError {
  constructor(message: string = ERROR_COPY.UPSTREAM_ERROR) {
    super(message, 'UPSTREAM_ERROR', 503);
    this.name = 'AuthUpstreamError';
  }
}
