'use client';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS, STALE_TIME } from '@/constants/query-keys.constant';
import { readPublicContent, readPublicFaqs } from '@/services/content.service';
import type {
  ContentInitial,
  PublicCmsKey,
  PublicContentDirectory,
  PublicFaqDirectory,
} from '@/types/content';

export function usePublicContent(
  keys: readonly PublicCmsKey[],
  initial: ContentInitial<PublicContentDirectory>,
) {
  const query = useQuery({
    queryKey: QUERY_KEYS.CONTENT(keys),
    queryFn: ({ signal }) => readPublicContent(keys, signal),
    staleTime: STALE_TIME.PUBLIC,
    initialData:
      initial.status === 'success'
        ? {
            ok: true as const,
            data: initial.data,
            requestId: 'server-initial',
          }
        : undefined,
  });

  return {
    items: query.data?.data.items ?? [],
    isPending: query.isPending,
    isError: query.isError,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}

export function usePublicFaqs(initial: ContentInitial<PublicFaqDirectory>) {
  const query = useQuery({
    queryKey: QUERY_KEYS.FAQS,
    queryFn: ({ signal }) => readPublicFaqs(signal),
    staleTime: STALE_TIME.PUBLIC,
    initialData:
      initial.status === 'success'
        ? {
            ok: true as const,
            data: initial.data,
            requestId: 'server-initial',
          }
        : undefined,
  });

  const items = query.data?.data.items ?? [];

  return {
    items,
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: query.isSuccess && items.length === 0,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}
