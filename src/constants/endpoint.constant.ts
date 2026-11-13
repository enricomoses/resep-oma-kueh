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
} as const;
