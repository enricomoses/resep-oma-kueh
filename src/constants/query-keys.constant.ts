export interface AdminQueryIdentity {
  userId: string;
  role: string;
  branchId: string | null;
}

export function toAdminQueryIdentity(
  profile: AdminQueryIdentity | null | undefined,
): AdminQueryIdentity | null {
  return profile
    ? {
        userId: profile.userId,
        role: profile.role,
        branchId: profile.branchId,
      }
    : null;
}

function adminScopedKey<
  const Scope extends string,
  const Extra extends readonly unknown[],
>(scope: Scope, identity: AdminQueryIdentity | null, ...extra: Extra) {
  return [
    'resep-oma-kueh',
    'admin',
    scope,
    identity?.userId ?? 'anon',
    identity?.role ?? 'none',
    identity?.branchId ?? 'none',
    ...extra,
  ] as const;
}

const ROOT_KEY = ['resep-oma-kueh'] as const;
const BRANCHES_ALL = ['resep-oma-kueh', 'branches'] as const;
const CATALOG_ALL = ['resep-oma-kueh', 'catalog'] as const;
const PRODUCT_DETAIL_ALL = ['resep-oma-kueh', 'product-detail'] as const;
const PROMOTIONS_ALL = ['resep-oma-kueh', 'promotions'] as const;
const CLASSES_ALL = ['resep-oma-kueh', 'classes'] as const;
const CLASS_DETAIL_ALL = ['resep-oma-kueh', 'class-detail'] as const;
const CONTENT_ALL = ['resep-oma-kueh', 'content'] as const;
const CART_VALIDATE_ALL = ['resep-oma-kueh', 'cart-validate'] as const;
const HOME_ALL = ['resep-oma-kueh', 'home'] as const;
const ADMIN_ROOT = ['resep-oma-kueh', 'admin'] as const;
const ADMIN_OVERVIEW_ALL = ['resep-oma-kueh', 'admin', 'overview'] as const;
const ADMIN_CLASS_PROGRAMS_ALL = [
  'resep-oma-kueh',
  'admin',
  'class-programs',
] as const;
const ADMIN_CLASS_SESSIONS_ALL = [
  'resep-oma-kueh',
  'admin',
  'class-sessions',
] as const;

export const QUERY_KEYS = {
  ROOT: ROOT_KEY,
  BRANCHES_ALL,
  BRANCHES: (code: string | null) => [...BRANCHES_ALL, code] as const,
  CATEGORIES: ['resep-oma-kueh', 'categories'] as const,
  CATALOG_ALL,
  CATALOG: (params: Record<string, string | number | null | undefined>) =>
    [...CATALOG_ALL, params] as const,
  PRODUCT_DETAIL_ALL,
  PRODUCT_DETAIL: (slug: string, branch: string | null) =>
    [...PRODUCT_DETAIL_ALL, slug, branch] as const,
  PROMOTIONS_ALL,
  PROMOTIONS: (branch: string | null) => [...PROMOTIONS_ALL, branch] as const,
  CLASSES_ALL,
  CLASSES: (branch: string | null) => [...CLASSES_ALL, branch] as const,
  CLASS_DETAIL_ALL,
  CLASS_DETAIL: (slug: string, branch: string | null) =>
    [...CLASS_DETAIL_ALL, slug, branch] as const,
  CONTENT_ALL,
  CONTENT: (keys: readonly string[]) => [...CONTENT_ALL, ...keys] as const,
  FAQS: ['resep-oma-kueh', 'faqs'] as const,
  CART_VALIDATE_ALL,
  CART_VALIDATE: (branchId: string | null, signature: string) =>
    [...CART_VALIDATE_ALL, branchId, signature] as const,
  HOME_ALL,
  ADMIN_ROOT,
  ADMIN_OVERVIEW_ALL,
  ADMIN_CLASS_PROGRAMS_ALL,
  ADMIN_CLASS_SESSIONS_ALL,
  ADMIN_SESSION: (identity: AdminQueryIdentity | null) =>
    adminScopedKey('session', identity),
  ADMIN_OVERVIEW: (identity: AdminQueryIdentity | null) =>
    adminScopedKey('overview', identity),
  ADMIN_CATEGORIES: (identity: AdminQueryIdentity | null) =>
    adminScopedKey('categories', identity),
  ADMIN_PRODUCTS: (
    identity: AdminQueryIdentity | null,
    params: Record<string, string | number | null | undefined>,
  ) => adminScopedKey('products', identity, params),
  ADMIN_PRODUCT_DETAIL: (identity: AdminQueryIdentity | null, id: string) =>
    adminScopedKey('product-detail', identity, id),
  ADMIN_PRODUCT_EDITOR: (identity: AdminQueryIdentity | null, id: string) =>
    adminScopedKey('product-editor', identity, id),
  ADMIN_BRANCHES: (identity: AdminQueryIdentity | null) =>
    adminScopedKey('branches', identity),
  ADMIN_AVAILABILITY: (
    identity: AdminQueryIdentity | null,
    params: Record<string, string | number | null | undefined>,
  ) => adminScopedKey('availability', identity, params),
  ADMIN_PROMOTIONS: (identity: AdminQueryIdentity | null) =>
    adminScopedKey('promotions', identity),
  ADMIN_CONTENT: (identity: AdminQueryIdentity | null) =>
    adminScopedKey('content', identity),
  ADMIN_FAQS: (identity: AdminQueryIdentity | null) =>
    adminScopedKey('faqs', identity),
  ADMIN_TESTIMONIALS: (identity: AdminQueryIdentity | null) =>
    adminScopedKey('testimonials', identity),
  ADMIN_CLASS_PROGRAMS: (identity: AdminQueryIdentity | null) =>
    adminScopedKey('class-programs', identity),
  ADMIN_CLASS_SESSIONS: (
    identity: AdminQueryIdentity | null,
    params: Record<string, string | null | undefined>,
  ) => adminScopedKey('class-sessions', identity, params),
} as const;

export const STALE_TIME = {
  ADMIN_FRESH: 0,
  BRANCH_OFFERS: 30_000,
  PUBLIC: 60_000,
} as const;

export const QUERY_LIMITS = {
  RETRIES: 1,
  GC_TIME_MS: 300_000,
  ADMIN_GC_TIME_MS: 60_000,
} as const;
