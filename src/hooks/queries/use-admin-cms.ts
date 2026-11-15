'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  QUERY_KEYS,
  toAdminQueryIdentity,
} from '@/constants/query-keys.constant';
import {
  ADMIN_QUERY_DEFAULTS,
  invalidateQueryKeys,
  unwrapData,
} from '@/hooks/queries/query-helpers';
import { adminCmsService } from '@/services/admin-cms.service';
import type {
  AdminCmsListResponse,
  AdminFaqListResponse,
  AdminTestimonialListResponse,
  ArchiveAdminCmsEntityInput,
  CreateAdminFaqInput,
  CreateAdminTestimonialInput,
  SaveAdminCmsInput,
  UpdateAdminFaqInput,
  UpdateAdminTestimonialInput,
} from '@/types/admin-cms';
import type { AdminSessionProfile } from '@/types/auth';
import type { PublicCmsKey } from '@/types/content';

const CMS_INVALIDATION_KEYS = [
  QUERY_KEYS.ADMIN_ROOT,
  QUERY_KEYS.CONTENT_ALL,
  QUERY_KEYS.FAQS,
  QUERY_KEYS.PROMOTIONS_ALL,
  QUERY_KEYS.HOME_ALL,
] as const;

/** Fetches owner-managed CMS entries. */
export function useAdminCmsEntries(
  profile: AdminSessionProfile,
  initialData?: AdminCmsListResponse,
) {
  return useQuery({
    queryKey: QUERY_KEYS.ADMIN_CONTENT(toAdminQueryIdentity(profile)),
    queryFn: ({ signal }) => unwrapData(adminCmsService.getEntries(signal)),
    initialData,
    enabled: profile.role === 'owner',
    ...ADMIN_QUERY_DEFAULTS,
  });
}

/** Saves an admin CMS entry and invalidates affected admin and public content caches. */
export function useSaveAdminCmsEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      key,
      payload,
    }: {
      key: PublicCmsKey;
      payload: SaveAdminCmsInput;
    }) => adminCmsService.saveEntry(key, payload),
    onSuccess: () => invalidateQueryKeys(queryClient, CMS_INVALIDATION_KEYS),
  });
}

/** Fetches owner-managed FAQ items. */
export function useAdminFaqs(
  profile: AdminSessionProfile,
  initialData?: AdminFaqListResponse,
) {
  return useQuery({
    queryKey: QUERY_KEYS.ADMIN_FAQS(toAdminQueryIdentity(profile)),
    queryFn: ({ signal }) => unwrapData(adminCmsService.getFaqs(signal)),
    initialData,
    enabled: profile.role === 'owner',
    ...ADMIN_QUERY_DEFAULTS,
  });
}

/** Creates an admin FAQ entry and invalidates affected caches. */
export function useCreateAdminFaq() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAdminFaqInput) =>
      adminCmsService.createFaq(payload),
    onSuccess: () => invalidateQueryKeys(queryClient, CMS_INVALIDATION_KEYS),
  });
}

/** Updates an admin FAQ entry and invalidates affected caches. */
export function useUpdateAdminFaq() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      faqId,
      payload,
    }: {
      faqId: string;
      payload: UpdateAdminFaqInput;
    }) => adminCmsService.updateFaq(faqId, payload),
    onSuccess: () => invalidateQueryKeys(queryClient, CMS_INVALIDATION_KEYS),
  });
}

/** Soft-archives an admin FAQ entry and invalidates affected caches. */
export function useArchiveAdminFaq() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      faqId,
      payload,
    }: {
      faqId: string;
      payload: ArchiveAdminCmsEntityInput;
    }) => adminCmsService.archiveFaq(faqId, payload),
    onSuccess: () => invalidateQueryKeys(queryClient, CMS_INVALIDATION_KEYS),
  });
}

/** Fetches owner-managed customer testimonials. */
export function useAdminTestimonials(
  profile: AdminSessionProfile,
  initialData?: AdminTestimonialListResponse,
) {
  return useQuery({
    queryKey: QUERY_KEYS.ADMIN_TESTIMONIALS(toAdminQueryIdentity(profile)),
    queryFn: ({ signal }) =>
      unwrapData(adminCmsService.getTestimonials(signal)),
    initialData,
    enabled: profile.role === 'owner',
    ...ADMIN_QUERY_DEFAULTS,
  });
}

/** Creates an admin testimonial and invalidates affected caches. */
export function useCreateAdminTestimonial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAdminTestimonialInput) =>
      adminCmsService.createTestimonial(payload),
    onSuccess: () => invalidateQueryKeys(queryClient, CMS_INVALIDATION_KEYS),
  });
}

/** Updates an admin testimonial and invalidates affected caches. */
export function useUpdateAdminTestimonial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      testimonialId,
      payload,
    }: {
      testimonialId: string;
      payload: UpdateAdminTestimonialInput;
    }) => adminCmsService.updateTestimonial(testimonialId, payload),
    onSuccess: () => invalidateQueryKeys(queryClient, CMS_INVALIDATION_KEYS),
  });
}

/** Soft-archives an admin testimonial and invalidates affected caches. */
export function useArchiveAdminTestimonial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      testimonialId,
      payload,
    }: {
      testimonialId: string;
      payload: ArchiveAdminCmsEntityInput;
    }) => adminCmsService.archiveTestimonial(testimonialId, payload),
    onSuccess: () => invalidateQueryKeys(queryClient, CMS_INVALIDATION_KEYS),
  });
}
