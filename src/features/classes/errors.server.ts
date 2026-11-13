import 'server-only';

import { CLASSES_COPY } from '@/constants/classes.constant';
import { type API_ERROR_CODES, ERROR_COPY } from '@/constants/copy.constant';

export type ClassApiErrorCode = (typeof API_ERROR_CODES)[number];

export class PublicClassError extends Error {
  readonly code: string;
  readonly apiCode: ClassApiErrorCode;
  readonly statusCode: number;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(
    message: string,
    code: string,
    apiCode: ClassApiErrorCode,
    statusCode: number,
    fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'PublicClassError';
    this.code = code;
    this.apiCode = apiCode;
    this.statusCode = statusCode;
    this.fieldErrors = fieldErrors;
  }
}

export class PublicClassNotFoundError extends PublicClassError {
  constructor(message: string = CLASSES_COPY.WA_ERRORS.SESSION_NOT_FOUND) {
    super(message, 'NOT_FOUND', 'NOT_FOUND', 404);
    this.name = 'PublicClassNotFoundError';
  }
}

export class PublicClassConflictError extends PublicClassError {
  constructor(
    code: string,
    message: string,
    fieldErrors?: Record<string, string[]>,
  ) {
    super(message, code, 'CONFLICT', 409, fieldErrors);
    this.name = 'PublicClassConflictError';
  }
}

export class PublicClassValidationError extends PublicClassError {
  constructor(
    message: string = ERROR_COPY.VALIDATION_ERROR,
    fieldErrors?: Record<string, string[]>,
  ) {
    super(message, 'VALIDATION_ERROR', 'VALIDATION_ERROR', 422, fieldErrors);
    this.name = 'PublicClassValidationError';
  }
}

export class PublicClassUpstreamError extends PublicClassError {
  constructor(message: string = CLASSES_COPY.WA_ERRORS.UPSTREAM_ERROR) {
    super(message, 'UPSTREAM_ERROR', 'UPSTREAM_ERROR', 503);
    this.name = 'PublicClassUpstreamError';
  }
}
