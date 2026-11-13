'use client';

import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys.constant';
import {
  archiveAdminFaqRequest,
  archiveAdminTestimonialRequest,
  createAdminFaqRequest,
  createAdminTestimonialRequest,
  readAdminCmsListRequest,
  readAdminFaqsRequest,
  readAdminTestimonialsRequest,
  saveAdminCmsEntryRequest,
  updateAdminFaqRequest,
  updateAdminTestimonialRequest,
} from '@/services/admin-cms.service';
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

const PUBLIC_CONTENT_PREFIX = ['resep-oma-kueh', 'content'] as const;
const PUBLIC_PROMOTIONS_PREFIX = ['resep-oma-kueh', 'promotions'] as const;
const PUBLIC_HOME_PREFIX = ['resep-oma-kueh', 'home'] as const;

function toIdentity(profile: AdminSessionProfile) {
  return {
    userId: profile.userId,
    role: profile.role,
    branchId: profile.branchId,
  };
}

function invalidateCmsScopes(queryClient: QueryClient) {
  void Promise.all([
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_ROOT }),
    queryClient.invalidateQueries({ queryKey: PUBLIC_CONTENT_PREFIX }),
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FAQS }),
    queryClient.invalidateQueries({ queryKey: PUBLIC_PROMOTIONS_PREFIX }),
    queryClient.invalidateQueries({ queryKey: PUBLIC_HOME_PREFIX }),
  ]);
}

export function useAdminCmsEntries(
  profile: AdminSessionProfile,
  initialData?: AdminCmsListResponse,
) {
  return useQuery({
    queryKey: QUERY_KEYS.ADMIN_CONTENT(toIdentity(profile)),
    queryFn: async ({ signal }) => {
      const response = await readAdminCmsListRequest(signal);
      return response.data;
    },
    initialData,
    enabled: profile.role === 'owner',
    staleTime: 0,
    gcTime: 60_000,
    retry: false,
  });
}

export function useSaveAdminCmsEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      key,
      payload,
    }: {
      key: PublicCmsKey;
      payload: SaveAdminCmsInput;
    }) => saveAdminCmsEntryRequest(key, payload),
    onSuccess: () => invalidateCmsScopes(queryClient),
  });
}

export function useAdminFaqs(
  profile: AdminSessionProfile,
  initialData?: AdminFaqListResponse,
) {
  return useQuery({
    queryKey: QUERY_KEYS.ADMIN_FAQS(toIdentity(profile)),
    queryFn: async ({ signal }) => {
      const response = await readAdminFaqsRequest(signal);
      return response.data;
    },
    initialData,
    enabled: profile.role === 'owner',
    staleTime: 0,
    gcTime: 60_000,
    retry: false,
  });
}

export function useCreateAdminFaq() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAdminFaqInput) =>
      createAdminFaqRequest(payload),
    onSuccess: () => invalidateCmsScopes(queryClient),
  });
}

export function useUpdateAdminFaq() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      faqId,
      payload,
    }: {
      faqId: string;
      payload: UpdateAdminFaqInput;
    }) => updateAdminFaqRequest(faqId, payload),
    onSuccess: () => invalidateCmsScopes(queryClient),
  });
}

export function useArchiveAdminFaq() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      faqId,
      payload,
    }: {
      faqId: string;
      payload: ArchiveAdminCmsEntityInput;
    }) => archiveAdminFaqRequest(faqId, payload),
    onSuccess: () => invalidateCmsScopes(queryClient),
  });
}

export function useAdminTestimonials(
  profile: AdminSessionProfile,
  initialData?: AdminTestimonialListResponse,
) {
  return useQuery({
    queryKey: QUERY_KEYS.ADMIN_TESTIMONIALS(toIdentity(profile)),
    queryFn: async ({ signal }) => {
      const response = await readAdminTestimonialsRequest(signal);
      return response.data;
    },
    initialData,
    enabled: profile.role === 'owner',
    staleTime: 0,
    gcTime: 60_000,
    retry: false,
  });
}

export function useCreateAdminTestimonial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAdminTestimonialInput) =>
      createAdminTestimonialRequest(payload),
    onSuccess: () => invalidateCmsScopes(queryClient),
  });
}

export function useUpdateAdminTestimonial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      testimonialId,
      payload,
    }: {
      testimonialId: string;
      payload: UpdateAdminTestimonialInput;
    }) => updateAdminTestimonialRequest(testimonialId, payload),
    onSuccess: () => invalidateCmsScopes(queryClient),
  });
}

export function useArchiveAdminTestimonial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      testimonialId,
      payload,
    }: {
      testimonialId: string;
      payload: ArchiveAdminCmsEntityInput;
    }) => archiveAdminTestimonialRequest(testimonialId, payload),
    onSuccess: () => invalidateCmsScopes(queryClient),
  });
}
