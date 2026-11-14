export const QUERY_KEYS = {
  ROOT: ['resep-oma-kueh'],
  BRANCHES: (code: string | null) =>
    ['resep-oma-kueh', 'branches', code] as const,
  CATEGORIES: ['resep-oma-kueh', 'categories'] as const,
  CATALOG: (params: Record<string, string | number | null | undefined>) =>
    ['resep-oma-kueh', 'catalog', params] as const,
  PRODUCT_DETAIL: (slug: string, branch: string | null) =>
    ['resep-oma-kueh', 'product-detail', slug, branch] as const,
  PROMOTIONS: (branch: string | null) =>
    ['resep-oma-kueh', 'promotions', branch] as const,
  CLASSES: (branch: string | null) =>
    ['resep-oma-kueh', 'classes', branch] as const,
  CLASS_DETAIL: (slug: string, branch: string | null) =>
    ['resep-oma-kueh', 'class-detail', slug, branch] as const,
  CONTENT: (keys: readonly string[]) =>
    ['resep-oma-kueh', 'content', ...keys] as const,
  FAQS: ['resep-oma-kueh', 'faqs'] as const,
  CART_VALIDATE: (branchId: string | null, signature: string) =>
    ['resep-oma-kueh', 'cart-validate', branchId, signature] as const,
  CHECKOUT_PREPARE: ['resep-oma-kueh', 'checkout-prepare'] as const,
  ADMIN_ROOT: ['resep-oma-kueh', 'admin'] as const,
  ADMIN_SESSION: (
    identity: {
      userId: string;
      role: string;
      branchId: string | null;
    } | null,
  ) =>
    [
      'resep-oma-kueh',
      'admin',
      'session',
      identity?.userId ?? 'anon',
      identity?.role ?? 'none',
      identity?.branchId ?? 'none',
    ] as const,
  ADMIN_OVERVIEW: (
    identity: {
      userId: string;
      role: string;
      branchId: string | null;
    } | null,
  ) =>
    [
      'resep-oma-kueh',
      'admin',
      'overview',
      identity?.userId ?? 'anon',
      identity?.role ?? 'none',
      identity?.branchId ?? 'none',
    ] as const,
  ADMIN_CATEGORIES: (
    identity: {
      userId: string;
      role: string;
      branchId: string | null;
    } | null,
  ) =>
    [
      'resep-oma-kueh',
      'admin',
      'categories',
      identity?.userId ?? 'anon',
      identity?.role ?? 'none',
      identity?.branchId ?? 'none',
    ] as const,
  ADMIN_PRODUCTS: (
    identity: {
      userId: string;
      role: string;
      branchId: string | null;
    } | null,
    params: Record<string, string | number | null | undefined>,
  ) =>
    [
      'resep-oma-kueh',
      'admin',
      'products',
      identity?.userId ?? 'anon',
      identity?.role ?? 'none',
      identity?.branchId ?? 'none',
      params,
    ] as const,
  ADMIN_PRODUCT_DETAIL: (
    identity: {
      userId: string;
      role: string;
      branchId: string | null;
    } | null,
    id: string,
  ) =>
    [
      'resep-oma-kueh',
      'admin',
      'product-detail',
      identity?.userId ?? 'anon',
      identity?.role ?? 'none',
      identity?.branchId ?? 'none',
      id,
    ] as const,
  ADMIN_PRODUCT_EDITOR: (
    identity: {
      userId: string;
      role: string;
      branchId: string | null;
    } | null,
    id: string,
  ) =>
    [
      'resep-oma-kueh',
      'admin',
      'product-editor',
      identity?.userId ?? 'anon',
      identity?.role ?? 'none',
      identity?.branchId ?? 'none',
      id,
    ] as const,
  ADMIN_BRANCHES: (
    identity: {
      userId: string;
      role: string;
      branchId: string | null;
    } | null,
  ) =>
    [
      'resep-oma-kueh',
      'admin',
      'branches',
      identity?.userId ?? 'anon',
      identity?.role ?? 'none',
      identity?.branchId ?? 'none',
    ] as const,
  ADMIN_AVAILABILITY: (
    identity: {
      userId: string;
      role: string;
      branchId: string | null;
    } | null,
    params: Record<string, string | number | null | undefined>,
  ) =>
    [
      'resep-oma-kueh',
      'admin',
      'availability',
      identity?.userId ?? 'anon',
      identity?.role ?? 'none',
      identity?.branchId ?? 'none',
      params,
    ] as const,
  ADMIN_PROMOTIONS: (
    identity: {
      userId: string;
      role: string;
      branchId: string | null;
    } | null,
  ) =>
    [
      'resep-oma-kueh',
      'admin',
      'promotions',
      identity?.userId ?? 'anon',
      identity?.role ?? 'none',
      identity?.branchId ?? 'none',
    ] as const,
  ADMIN_CONTENT: (
    identity: {
      userId: string;
      role: string;
      branchId: string | null;
    } | null,
  ) =>
    [
      'resep-oma-kueh',
      'admin',
      'content',
      identity?.userId ?? 'anon',
      identity?.role ?? 'none',
      identity?.branchId ?? 'none',
    ] as const,
  ADMIN_FAQS: (
    identity: {
      userId: string;
      role: string;
      branchId: string | null;
    } | null,
  ) =>
    [
      'resep-oma-kueh',
      'admin',
      'faqs',
      identity?.userId ?? 'anon',
      identity?.role ?? 'none',
      identity?.branchId ?? 'none',
    ] as const,
  ADMIN_TESTIMONIALS: (
    identity: {
      userId: string;
      role: string;
      branchId: string | null;
    } | null,
  ) =>
    [
      'resep-oma-kueh',
      'admin',
      'testimonials',
      identity?.userId ?? 'anon',
      identity?.role ?? 'none',
      identity?.branchId ?? 'none',
    ] as const,
  ADMIN_CLASS_PROGRAMS: (
    identity: {
      userId: string;
      role: string;
      branchId: string | null;
    } | null,
  ) =>
    [
      'resep-oma-kueh',
      'admin',
      'class-programs',
      identity?.userId ?? 'anon',
      identity?.role ?? 'none',
      identity?.branchId ?? 'none',
    ] as const,
  ADMIN_CLASS_SESSIONS: (
    identity: {
      userId: string;
      role: string;
      branchId: string | null;
    } | null,
    params: Record<string, string | null | undefined>,
  ) =>
    [
      'resep-oma-kueh',
      'admin',
      'class-sessions',
      identity?.userId ?? 'anon',
      identity?.role ?? 'none',
      identity?.branchId ?? 'none',
      params,
    ] as const,
} as const;

export const STALE_TIME = {
  PUBLIC: 60_000,
  BRANCH_OFFERS: 30_000,
} as const;

export const QUERY_LIMITS = { RETRIES: 1, GC_TIME_MS: 300_000 } as const;
