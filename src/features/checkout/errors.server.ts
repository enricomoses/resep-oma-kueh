import 'server-only';
import { CHECKOUT_COPY } from '@/constants/checkout.constant';
import type { ApiErrorCode } from '@/types';

export class CheckoutError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(
    message: string,
    code: ApiErrorCode,
    status: number,
    fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'CheckoutError';
    this.code = code;
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export class CheckoutBranchNotFoundError extends CheckoutError {
  constructor(message: string = CHECKOUT_COPY.ERROR_BRANCH_NOT_FOUND) {
    super(message, 'NOT_FOUND', 404);
    this.name = 'CheckoutBranchNotFoundError';
  }
}

export class CheckoutItemUnavailableError extends CheckoutError {
  constructor(message: string = CHECKOUT_COPY.ERROR_ITEM_NOT_OFFERED) {
    super(message, 'ITEM_UNAVAILABLE', 409);
    this.name = 'CheckoutItemUnavailableError';
  }
}

export class CheckoutStockChangedError extends CheckoutError {
  constructor(message: string = CHECKOUT_COPY.ERROR_ITEM_SOLDOUT) {
    super(message, 'STOCK_CHANGED', 409);
    this.name = 'CheckoutStockChangedError';
  }
}

export class CheckoutValidationError extends CheckoutError {
  constructor(
    message: string = CHECKOUT_COPY.ERROR_INVALID_REQUEST,
    fieldErrors?: Record<string, string[]>,
  ) {
    super(message, 'VALIDATION_ERROR', 422, fieldErrors);
    this.name = 'CheckoutValidationError';
  }
}

export class CheckoutRequestTooLargeError extends CheckoutError {
  constructor(message: string = CHECKOUT_COPY.ERROR_TOO_LARGE) {
    super(message, 'REQUEST_TOO_LARGE', 413);
    this.name = 'CheckoutRequestTooLargeError';
  }
}

export class CheckoutUpstreamError extends CheckoutError {
  constructor(message: string = CHECKOUT_COPY.ERROR_UPSTREAM) {
    super(message, 'UPSTREAM_ERROR', 503);
    this.name = 'CheckoutUpstreamError';
  }
}

export class CheckoutTimeoutError extends CheckoutError {
  constructor(message: string = 'Permintaan checkout melewati batas waktu.') {
    super(message, 'TIMEOUT', 504);
    this.name = 'CheckoutTimeoutError';
  }
}
