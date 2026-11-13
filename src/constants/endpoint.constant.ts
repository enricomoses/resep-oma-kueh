// Domain endpoints are added with their implementing feature, never as stubs.
export const API_ENDPOINTS = {
  BASE: '/api',
  BRANCHES: '/branches',
  CATEGORIES: '/categories',
  CATALOG: '/catalog',
  PRODUCTS: '/products',
  CONTENT: '/content',
  FAQS: '/faqs',
  CART_VALIDATE: '/cart/validate',
  CHECKOUT_PREPARE: '/checkout/prepare',
  AUTH_LOGIN: '/auth/login',
  AUTH_LOGOUT: '/auth/logout',
  AUTH_REQUEST_RESET: '/auth/request-password-reset',
  AUTH_UPDATE_PASSWORD: '/auth/update-password',
  ADMIN_SESSION: '/admin/session',
} as const;
