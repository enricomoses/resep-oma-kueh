import { API_ENDPOINTS } from '@/constants/endpoint.constant';
import { requestApi } from '@/lib/axios';
import type {
  ArchiveAdminCmsEntityInput,
  CreateAdminFaqInput,
  CreateAdminTestimonialInput,
  SaveAdminCmsInput,
  UpdateAdminFaqInput,
  UpdateAdminTestimonialInput,
} from '@/types/admin-cms';
import type { PublicCmsKey } from '@/types/content';
import {
  adminCmsListResponseSchema,
  adminCmsMutationResponseSchema,
  adminFaqListResponseSchema,
  adminFaqMutationResponseSchema,
  adminTestimonialListResponseSchema,
  adminTestimonialMutationResponseSchema,
} from '@/validations/admin-cms.schema';

/** Admin CMS entries, FAQs, and customer testimonials service. */
export const adminCmsService = {
  getEntries: (signal?: AbortSignal) =>
    requestApi(
      {
        url: API_ENDPOINTS.ADMIN_CONTENT,
        method: 'GET',
        signal,
      },
      adminCmsListResponseSchema,
    ),

  saveEntry: (
    key: PublicCmsKey,
    payload: SaveAdminCmsInput,
    signal?: AbortSignal,
  ) =>
    requestApi(
      {
        url: API_ENDPOINTS.ADMIN_CONTENT_KEY(key),
        method: 'PUT',
        data: payload,
        signal,
      },
      adminCmsMutationResponseSchema,
    ),

  getFaqs: (signal?: AbortSignal) =>
    requestApi(
      {
        url: API_ENDPOINTS.ADMIN_FAQS,
        method: 'GET',
        signal,
      },
      adminFaqListResponseSchema,
    ),

  createFaq: (payload: CreateAdminFaqInput, signal?: AbortSignal) =>
    requestApi(
      {
        url: API_ENDPOINTS.ADMIN_FAQS,
        method: 'POST',
        data: payload,
        signal,
      },
      adminFaqMutationResponseSchema,
    ),

  updateFaq: (
    faqId: string,
    payload: UpdateAdminFaqInput,
    signal?: AbortSignal,
  ) =>
    requestApi(
      {
        url: API_ENDPOINTS.ADMIN_FAQ_DETAIL(faqId),
        method: 'PATCH',
        data: payload,
        signal,
      },
      adminFaqMutationResponseSchema,
    ),

  archiveFaq: (
    faqId: string,
    payload: ArchiveAdminCmsEntityInput,
    signal?: AbortSignal,
  ) =>
    requestApi(
      {
        url: API_ENDPOINTS.ADMIN_FAQ_DETAIL(faqId),
        method: 'DELETE',
        data: payload,
        signal,
      },
      adminFaqMutationResponseSchema,
    ),

  getTestimonials: (signal?: AbortSignal) =>
    requestApi(
      {
        url: API_ENDPOINTS.ADMIN_TESTIMONIALS,
        method: 'GET',
        signal,
      },
      adminTestimonialListResponseSchema,
    ),

  createTestimonial: (
    payload: CreateAdminTestimonialInput,
    signal?: AbortSignal,
  ) =>
    requestApi(
      {
        url: API_ENDPOINTS.ADMIN_TESTIMONIALS,
        method: 'POST',
        data: payload,
        signal,
      },
      adminTestimonialMutationResponseSchema,
    ),

  updateTestimonial: (
    testimonialId: string,
    payload: UpdateAdminTestimonialInput,
    signal?: AbortSignal,
  ) =>
    requestApi(
      {
        url: API_ENDPOINTS.ADMIN_TESTIMONIAL_DETAIL(testimonialId),
        method: 'PATCH',
        data: payload,
        signal,
      },
      adminTestimonialMutationResponseSchema,
    ),

  archiveTestimonial: (
    testimonialId: string,
    payload: ArchiveAdminCmsEntityInput,
    signal?: AbortSignal,
  ) =>
    requestApi(
      {
        url: API_ENDPOINTS.ADMIN_TESTIMONIAL_DETAIL(testimonialId),
        method: 'DELETE',
        data: payload,
        signal,
      },
      adminTestimonialMutationResponseSchema,
    ),
};
