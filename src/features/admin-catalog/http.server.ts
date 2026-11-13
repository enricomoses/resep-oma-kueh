import 'server-only';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { ERROR_COPY } from '@/constants/copy.constant';
import { ROUTES } from '@/constants/routes.constant';
import {
  AuthInvalidRequestError,
  AuthValidationError,
} from '@/features/auth/errors.server';

export function revalidatePublicCatalogPaths(): void {
  try {
    revalidatePath(ROUTES.HOME);
    revalidatePath(ROUTES.MENU);
  } catch {
    // Outside Next.js request lifecycle (e.g., direct handler tests).
  }
}

export function revalidatePublicLocationAndOfferPaths(): void {
  try {
    revalidatePath(ROUTES.HOME);
    revalidatePath(ROUTES.MENU);
    revalidatePath(ROUTES.CONTACT);
    revalidatePath(ROUTES.CART);
    revalidatePath(ROUTES.CHECKOUT);
  } catch {
    // Outside Next.js request lifecycle (e.g., direct handler tests).
  }
}

export function revalidatePublicPromotionPaths(): void {
  try {
    revalidatePath(ROUTES.HOME);
    revalidatePath(ROUTES.MENU);
    revalidatePath(ROUTES.CART);
    revalidatePath(ROUTES.CHECKOUT);
  } catch {
    // Outside Next.js request lifecycle (e.g., direct handler tests).
  }
}

export function revalidatePublicContentPaths(): void {
  try {
    revalidatePath(ROUTES.HOME);
    revalidatePath(ROUTES.ABOUT);
    revalidatePath(ROUTES.CONTACT);
    revalidatePath(ROUTES.FAQ);
    revalidatePath(ROUTES.PRIVACY);
    revalidatePath(ROUTES.ORDERING_POLICY);
  } catch {
    // Outside Next.js request lifecycle (e.g., direct handler tests).
  }
}

export function revalidatePublicClassPaths(programSlug?: string): void {
  try {
    revalidatePath(ROUTES.HOME);
    revalidatePath(ROUTES.CLASSES);
    if (programSlug) {
      revalidatePath(`${ROUTES.CLASSES}/${programSlug}`);
    }
  } catch {
    // Outside Next.js request lifecycle (e.g., direct handler tests).
  }
}

const uuidSchema = z.uuid();

export function parseUuidRouteParam(rawId: string): string {
  const parsed = uuidSchema.safeParse(rawId);
  if (!parsed.success) {
    throw new AuthInvalidRequestError(ERROR_COPY.INVALID_REQUEST);
  }
  return parsed.data;
}

export function rejectProductPriceFields(rawBody: unknown): void {
  if (!rawBody || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
    return;
  }
  const obj = rawBody as Record<string, unknown>;
  if ('price_idr' in obj || 'priceIdr' in obj || 'basePriceIdr' in obj) {
    throw new AuthValidationError(ERROR_COPY.VALIDATION_ERROR, {
      root: [ADMIN_CATALOG_COPY.PRODUCTS.ERRORS.PRICE_NOT_ON_PRODUCT],
    });
  }
}

export function rejectImmutableSlugOnPatch(
  rawBody: unknown,
  currentSlug: string,
  entity: 'category' | 'product',
): void {
  if (!rawBody || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
    return;
  }
  const obj = rawBody as Record<string, unknown>;
  if ('slug' in obj && obj.slug !== currentSlug) {
    const msg =
      entity === 'category'
        ? ADMIN_CATALOG_COPY.CATEGORIES.ERRORS.SLUG_IMMUTABLE
        : ADMIN_CATALOG_COPY.PRODUCTS.ERRORS.SLUG_IMMUTABLE;
    throw new AuthValidationError(msg, { slug: [msg] });
  }
}

export function stripUnchangedSlugForPatch(rawBody: unknown): unknown {
  if (!rawBody || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
    return rawBody;
  }
  const obj = rawBody as Record<string, unknown>;
  if (!('slug' in obj)) {
    return rawBody;
  }
  const rest = { ...obj };
  delete rest.slug;
  return rest;
}
