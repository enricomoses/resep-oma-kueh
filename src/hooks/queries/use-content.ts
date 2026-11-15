'use client';

import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS, STALE_TIME } from '@/constants/query-keys.constant';
import { unwrapData } from '@/hooks/queries/query-helpers';
import { contentService } from '@/services/content.service';
import type {
  ContentInitial,
  PublicCmsKey,
  PublicContentDirectory,
  PublicFaqDirectory,
} from '@/types/content';

/** Fetches public CMS content entries by key, keeping SSR hydration consistent. */
export function usePublicContent(
  keys: readonly PublicCmsKey[],
  initial: ContentInitial<PublicContentDirectory>,
) {
  const query = useQuery({
    queryKey: QUERY_KEYS.CONTENT(keys),
    queryFn: ({ signal }) => unwrapData(contentService.getByKeys(keys, signal)),
    staleTime: STALE_TIME.PUBLIC,
    initialData: initial.status === 'success' ? initial.data : undefined,
  });

  return {
    items: query.data?.items ?? [],
    isPending: query.isPending,
    isError: query.isError,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}

/** Fetches published FAQ items and exposes convenience empty/error flags. */
export function usePublicFaqs(initial: ContentInitial<PublicFaqDirectory>) {
  const query = useQuery({
    queryKey: QUERY_KEYS.FAQS,
    queryFn: ({ signal }) => unwrapData(contentService.getFaqs(signal)),
    staleTime: STALE_TIME.PUBLIC,
    initialData: initial.status === 'success' ? initial.data : undefined,
  });

  const items = query.data?.items ?? [];

  return {
    items,
    isPending: query.isPending,
    isError: query.isError,
    isEmpty: query.isSuccess && items.length === 0,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}
