import 'server-only';

import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { ERROR_COPY } from '@/constants/copy.constant';
import { AuthError, AuthForbiddenError } from '@/features/auth/errors.server';

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

export function mapPostgresPromotionError(error: PostgresLikeError): never {
  const code = error.code ?? '';
  const message = (error.message ?? '').toLowerCase();

  if (code === '42501') {
    throw new AuthForbiddenError(
      ADMIN_CATALOG_COPY.PROMOTIONS.ERRORS.OWNER_ONLY,
    );
  }

  if (code === '40900') {
    throw new AdminCatalogConflictError(
      ADMIN_CATALOG_COPY.PROMOTIONS.ERRORS.STALE_CONFLICT,
    );
  }

  if (code === 'P0002') {
    if (message.includes('promotion_not_found')) {
      throw new AdminCatalogNotFoundError();
    }
    if (message.includes('branch_not_found')) {
      throw new AdminCatalogValidationError('Cabang target tidak ditemukan.', {
        branchIds: ['Cabang target tidak ditemukan.'],
      });
    }
    if (message.includes('promotion_target_not_found')) {
      throw new AdminCatalogValidationError(
        ADMIN_CATALOG_COPY.PROMOTIONS.ERRORS.TARGET_MISSING,
        { targets: [ADMIN_CATALOG_COPY.PROMOTIONS.ERRORS.TARGET_MISSING] },
      );
    }
    throw new AdminCatalogNotFoundError();
  }

  if (code === '23505') {
    const msg = ADMIN_CATALOG_COPY.PROMOTIONS.ERRORS.SLUG_COLLISION;
    throw new AdminCatalogConflictError(msg, { slug: [msg] });
  }

  if (code === '23514') {
    if (message.includes('identity_is_immutable')) {
      const msg = ADMIN_CATALOG_COPY.PROMOTIONS.ERRORS.SLUG_IMMUTABLE;
      throw new AdminCatalogValidationError(msg, { slug: [msg] });
    }
    if (message.includes('promotion_non_stackable')) {
      const msg = ADMIN_CATALOG_COPY.PROMOTIONS.ERRORS.NON_STACKABLE;
      throw new AdminCatalogValidationError(msg, { isStackable: [msg] });
    }
    if (message.includes('invalid_promotion_period')) {
      const msg = ADMIN_CATALOG_COPY.PROMOTIONS.ERRORS.INVALID_PERIOD;
      throw new AdminCatalogValidationError(msg, { endsAt: [msg] });
    }
    if (message.includes('promotion_branch_inactive')) {
      const msg = ADMIN_CATALOG_COPY.PROMOTIONS.ERRORS.BRANCH_INACTIVE;
      throw new AdminCatalogValidationError(msg, { branchIds: [msg] });
    }
    if (message.includes('promotion_target_mismatch')) {
      const msg = ADMIN_CATALOG_COPY.PROMOTIONS.ERRORS.TARGET_MISSING;
      throw new AdminCatalogValidationError(msg, { targets: [msg] });
    }
  }

  throw new AdminCatalogUpstreamError();
}
