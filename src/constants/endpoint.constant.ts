// Domain endpoints are added with their implementing feature, never as stubs.
export const API_ENDPOINTS = {
  BASE: '/api',
  BRANCHES: '/branches',
  CATEGORIES: '/categories',
  CATALOG: '/catalog',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: (slug: string) => `/products/${encodeURIComponent(slug)}`,
  PROMOTIONS: '/promotions',
  CLASSES: '/classes',
  CLASS_DETAIL: (slug: string) => `/classes/${encodeURIComponent(slug)}`,
  CLASSES_PREPARE_REGISTRATION: '/classes/prepare-registration',
  CONTENT: '/content',
  FAQS: '/faqs',
  CART_VALIDATE: '/cart/validate',
  CHECKOUT_PREPARE: '/checkout/prepare',
  CHAT: '/chat',
  AUTH_LOGIN: '/auth/login',
  AUTH_LOGOUT: '/auth/logout',
  AUTH_REQUEST_RESET: '/auth/request-password-reset',
  AUTH_UPDATE_PASSWORD: '/auth/update-password',
  ADMIN_SESSION: '/admin/session',
  ADMIN_OVERVIEW: '/admin/overview',
  ADMIN_CATEGORIES: '/admin/categories',
  ADMIN_CATEGORY_DETAIL: (id: string) =>
    `/admin/categories/${encodeURIComponent(id)}`,
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_PRODUCT_DETAIL: (id: string) =>
    `/admin/products/${encodeURIComponent(id)}`,
  ADMIN_PRODUCT_CONFIGURATION: (id: string) =>
    `/admin/products/${encodeURIComponent(id)}/configuration`,
  ADMIN_MEDIA_UPLOAD: '/admin/media/upload',
  ADMIN_BRANCHES: '/admin/branches',
  ADMIN_BRANCH_DETAIL: (id: string) =>
    `/admin/branches/${encodeURIComponent(id)}`,
  ADMIN_BRANCH_HOURS: (id: string) =>
    `/admin/branches/${encodeURIComponent(id)}/hours`,
  ADMIN_AVAILABILITY: '/admin/availability',
  ADMIN_AVAILABILITY_ITEM: (branchId: string, variantId: string) =>
    `/admin/availability/${encodeURIComponent(branchId)}/${encodeURIComponent(variantId)}`,
  ADMIN_AVAILABILITY_BULK: '/admin/availability/bulk',
  ADMIN_PROMOTIONS: '/admin/promotions',
  ADMIN_PROMOTION_DETAIL: (id: string) =>
    `/admin/promotions/${encodeURIComponent(id)}`,
  ADMIN_PROMOTIONS_SHIPPING_BANNER: '/admin/promotions/shipping-banner',
  ADMIN_CONTENT: '/admin/content',
  ADMIN_CONTENT_KEY: (key: string) =>
    `/admin/content/${encodeURIComponent(key)}`,
  ADMIN_FAQS: '/admin/faqs',
  ADMIN_FAQ_DETAIL: (id: string) => `/admin/faqs/${encodeURIComponent(id)}`,
  ADMIN_TESTIMONIALS: '/admin/testimonials',
  ADMIN_TESTIMONIAL_DETAIL: (id: string) =>
    `/admin/testimonials/${encodeURIComponent(id)}`,
  ADMIN_CLASS_PROGRAMS: '/admin/classes/programs',
  ADMIN_CLASS_PROGRAM_DETAIL: (id: string) =>
    `/admin/classes/programs/${encodeURIComponent(id)}`,
  ADMIN_CLASS_SESSIONS: '/admin/classes/sessions',
  ADMIN_CLASS_SESSION_DETAIL: (id: string) =>
    `/admin/classes/sessions/${encodeURIComponent(id)}`,
} as const;
