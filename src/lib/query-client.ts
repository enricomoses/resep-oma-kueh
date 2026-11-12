import { QueryClient } from '@tanstack/react-query';

import {
  QUERY_KEYS,
  QUERY_LIMITS,
  STALE_TIME,
} from '@/constants/query-keys.constant';

import { shouldRetryRequest } from './errors';

export function createQueryClient() {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetryRequest,
        refetchOnWindowFocus: true,
        gcTime: QUERY_LIMITS.GC_TIME_MS,
      },
      mutations: { retry: false },
    },
  });
  client.setQueryDefaults(QUERY_KEYS.ROOT, { staleTime: STALE_TIME.PUBLIC });
  return client;
}
