import 'server-only';

import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { ERROR_COPY } from '@/constants/copy.constant';
import { AuthError } from '@/features/auth/errors.server';

export class AdminCatalogNotFoundError extends AuthError {
  constructor(message: string = ERROR_COPY.NOT_FOUND) {
    super(message, 'NOT_FOUND', 404);
    this.name = 'AdminCatalogNotFoundError';
  }
}

export class AdminCatalogConflictError extends AuthError {
  constructor(
    message: string = ERROR_COPY.CONFLICT,
    fieldErrors?: Record<string, string[]>,
  ) {
    super(message, 'CONFLICT', 409, { fieldErrors });
    this.name = 'AdminCatalogConflictError';
  }
}

export class AdminCatalogValidationError extends AuthError {
  constructor(
    message: string = ERROR_COPY.VALIDATION_ERROR,
    fieldErrors?: Record<string, string[]>,
  ) {
    super(message, 'VALIDATION_ERROR', 422, { fieldErrors });
    this.name = 'AdminCatalogValidationError';
  }
}

export class AdminCatalogUpstreamError extends AuthError {
  constructor(message: string = ERROR_COPY.UPSTREAM_ERROR) {
    super(message, 'UPSTREAM_ERROR', 503);
    this.name = 'AdminCatalogUpstreamError';
  }
}

interface PostgresLikeError {
  code?: string | null;
  message?: string | null;
}

export function mapPostgresCatalogError(
  error: PostgresLikeError,
  entity: 'category' | 'product',
): never {
  const code = error.code ?? '';
  const message = (error.message ?? '').toLowerCase();

  if (code === '23505') {
    const msg =
      entity === 'category'
        ? ADMIN_CATALOG_COPY.CATEGORIES.ERRORS.SLUG_COLLISION
        : ADMIN_CATALOG_COPY.PRODUCTS.ERRORS.SLUG_COLLISION;
    throw new AdminCatalogConflictError(msg, { slug: [msg] });
  }

  if (code === '23514') {
    if (message.includes('category_cycle')) {
      const msg = ADMIN_CATALOG_COPY.CATEGORIES.ERRORS.CYCLE;
      throw new AdminCatalogValidationError(msg, { parentId: [msg] });
    }
    if (message.includes('category_parent_not_published')) {
      const msg = ADMIN_CATALOG_COPY.CATEGORIES.ERRORS.PARENT_UNPUBLISHED;
      throw new AdminCatalogValidationError(msg, { status: [msg] });
    }
    if (message.includes('identity_is_immutable')) {
      const msg =
        entity === 'category'
          ? ADMIN_CATALOG_COPY.CATEGORIES.ERRORS.SLUG_IMMUTABLE
          : ADMIN_CATALOG_COPY.PRODUCTS.ERRORS.SLUG_IMMUTABLE;
      throw new AdminCatalogValidationError(msg, { slug: [msg] });
    }
    if (message.includes('product_not_publish_ready')) {
      const msg = ADMIN_CATALOG_COPY.PRODUCTS.ERRORS.PUBLISH_NOT_READY;
      throw new AdminCatalogValidationError(msg, { status: [msg] });
    }
  }

  if (code === '23503') {
    throw new AdminCatalogValidationError(ERROR_COPY.VALIDATION_ERROR, {
      parentId: ['Referensi induk tidak ditemukan.'],
    });
  }

  throw new AdminCatalogUpstreamError();
}
