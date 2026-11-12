import { ERROR_COPY } from '@/constants/copy.constant';
import { QUERY_LIMITS } from '@/constants/query-keys.constant';
import type { ApiErrorCode } from '@/types';

interface ErrorDetails {
  code: ApiErrorCode;
  status?: number;
  requestId?: string;
  fieldErrors?: Record<string, string[]>;
  message?: string;
}

export class ApiClientError extends Error {
  readonly code: ApiErrorCode;
  readonly status?: number;
  readonly requestId?: string;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(details: ErrorDetails) {
    super(details.message ?? ERROR_COPY[details.code]);
    this.name = 'ApiClientError';
    this.code = details.code;
    this.status = details.status;
    this.requestId = details.requestId;
    this.fieldErrors = details.fieldErrors;
  }
}

export function shouldRetryRequest(failureCount: number, error: Error) {
  if (error instanceof ApiClientError) {
    if (error.code === 'CANCELED' || error.code === 'INVALID_RESPONSE')
      return false;
    if (error.status && error.status >= 400 && error.status < 500) return false;
  }
  return failureCount < QUERY_LIMITS.RETRIES;
}
