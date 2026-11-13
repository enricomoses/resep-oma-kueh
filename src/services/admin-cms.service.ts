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

export function readAdminCmsListRequest(signal?: AbortSignal) {
  return requestApi(
    {
      url: API_ENDPOINTS.ADMIN_CONTENT,
      method: 'GET',
      signal,
    },
    adminCmsListResponseSchema,
  );
}

export function saveAdminCmsEntryRequest(
  key: PublicCmsKey,
  payload: SaveAdminCmsInput,
  signal?: AbortSignal,
) {
  return requestApi(
    {
      url: `${API_ENDPOINTS.ADMIN_CONTENT}/${encodeURIComponent(key)}`,
      method: 'PUT',
      data: payload,
      signal,
    },
    adminCmsMutationResponseSchema,
  );
}

export function readAdminFaqsRequest(signal?: AbortSignal) {
  return requestApi(
    {
      url: API_ENDPOINTS.ADMIN_FAQS,
      method: 'GET',
      signal,
    },
    adminFaqListResponseSchema,
  );
}

export function createAdminFaqRequest(
  payload: CreateAdminFaqInput,
  signal?: AbortSignal,
) {
  return requestApi(
    {
      url: API_ENDPOINTS.ADMIN_FAQS,
      method: 'POST',
      data: payload,
      signal,
    },
    adminFaqMutationResponseSchema,
  );
}

export function updateAdminFaqRequest(
  faqId: string,
  payload: UpdateAdminFaqInput,
  signal?: AbortSignal,
) {
  return requestApi(
    {
      url: `${API_ENDPOINTS.ADMIN_FAQS}/${encodeURIComponent(faqId)}`,
      method: 'PATCH',
      data: payload,
      signal,
    },
    adminFaqMutationResponseSchema,
  );
}

export function archiveAdminFaqRequest(
  faqId: string,
  payload: ArchiveAdminCmsEntityInput,
  signal?: AbortSignal,
) {
  return requestApi(
    {
      url: `${API_ENDPOINTS.ADMIN_FAQS}/${encodeURIComponent(faqId)}`,
      method: 'DELETE',
      data: payload,
      signal,
    },
    adminFaqMutationResponseSchema,
  );
}

export function readAdminTestimonialsRequest(signal?: AbortSignal) {
  return requestApi(
    {
      url: API_ENDPOINTS.ADMIN_TESTIMONIALS,
      method: 'GET',
      signal,
    },
    adminTestimonialListResponseSchema,
  );
}

export function createAdminTestimonialRequest(
  payload: CreateAdminTestimonialInput,
  signal?: AbortSignal,
) {
  return requestApi(
    {
      url: API_ENDPOINTS.ADMIN_TESTIMONIALS,
      method: 'POST',
      data: payload,
      signal,
    },
    adminTestimonialMutationResponseSchema,
  );
}

export function updateAdminTestimonialRequest(
  testimonialId: string,
  payload: UpdateAdminTestimonialInput,
  signal?: AbortSignal,
) {
  return requestApi(
    {
      url: `${API_ENDPOINTS.ADMIN_TESTIMONIALS}/${encodeURIComponent(testimonialId)}`,
      method: 'PATCH',
      data: payload,
      signal,
    },
    adminTestimonialMutationResponseSchema,
  );
}

export function archiveAdminTestimonialRequest(
  testimonialId: string,
  payload: ArchiveAdminCmsEntityInput,
  signal?: AbortSignal,
) {
  return requestApi(
    {
      url: `${API_ENDPOINTS.ADMIN_TESTIMONIALS}/${encodeURIComponent(testimonialId)}`,
      method: 'DELETE',
      data: payload,
      signal,
    },
    adminTestimonialMutationResponseSchema,
  );
}
