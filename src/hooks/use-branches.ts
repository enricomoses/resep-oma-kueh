'use client';
import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useRef, useState } from 'react';
import { QUERY_KEYS, STALE_TIME } from '@/constants/query-keys.constant';
import { BRANCH, SITE_COPY } from '@/constants/site.constant';
import {
  useBranchContext,
  useBranchPreference,
} from '@/providers/branch-provider';
import { readBranches } from '@/services/branches.service';
import { withBranch } from '@/utils/branch-url';
import type { PublicBranch } from '@/types/branch';

export function useBranches() {
  const context = useBranchContext();
  const preference = useBranchPreference();
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const codes = params.getAll(BRANCH.PARAM);
  const code = codes.length === 0 ? null : codes.length === 1 ? codes[0] : '';
  const serverInitialData =
    code === null && context.initial.status === 'success'
      ? context.initial.data
      : undefined;
  const hasServerInitial = serverInitialData !== undefined;
  const query = useQuery({
    queryKey: QUERY_KEYS.BRANCHES(code),
    queryFn: ({ signal }) => readBranches(code, signal),
    staleTime: STALE_TIME.PUBLIC,
    initialData: serverInitialData
      ? {
          ok: true as const,
          data: serverInitialData,
          requestId: 'server-initial',
        }
      : undefined,
  });
  // Match SSR HTML on initial hydration render even when Suspense siblings resolve React Query first.
  const canExposeClientQuery = context.hydrated || hasServerInitial;
  const data = canExposeClientQuery ? query.data?.data : undefined;
  const items = data?.items ?? [];
  const selected =
    !canExposeClientQuery || query.isError
      ? null
      : code !== null
        ? (items.find((item) => item.id === data?.resolvedBranchId) ?? null)
        : context.hydrated
          ? (items.find((item) => item.id === preference) ?? null)
          : null;
  const [pending, setPending] = useState<PublicBranch | null>(null);
  const [notice, setNotice] = useState('');
  const busy = useRef(false);
  const switchBranch = async (next: PublicBranch, confirmed = false) => {
    if (busy.current) return;
    if (next.id === selected?.id) return;
    setNotice('');
    if (context.cartItemCount > 0 && !confirmed) {
      setPending(next);
      return;
    }
    busy.current = true;
    try {
      if (context.cartItemCount > 0 && !context.beforeBranchChange) {
        setNotice(SITE_COPY.SWITCH_BLOCKED);
        return;
      }
      if (
        context.beforeBranchChange &&
        !(await context.beforeBranchChange({
          currentBranchId: selected?.id ?? null,
          nextBranchId: next.id,
        }))
      ) {
        setNotice(SITE_COPY.SWITCH_BLOCKED);
        return;
      }
      try {
        context.store.getState().setSelectedBranchId(next.id);
      } catch {
        setNotice(SITE_COPY.STORAGE_UNAVAILABLE);
      }
      router.replace(withBranch(`${pathname}?${params}`, next.code), {
        scroll: false,
      });
      setPending(null);
    } catch {
      setNotice(SITE_COPY.SWITCH_BLOCKED);
    } finally {
      busy.current = false;
    }
  };
  return {
    pathname,
    items,
    selected,
    code,
    hydrated: context.hydrated,
    isPending: canExposeClientQuery ? query.isPending : true,
    isError: canExposeClientQuery ? query.isError : false,
    isEmpty: canExposeClientQuery && query.isSuccess && items.length === 0,
    invalidUrl:
      canExposeClientQuery &&
      code !== null &&
      query.isSuccess &&
      !data?.resolvedBranchId,
    invalidPreference:
      code === null &&
      context.hydrated &&
      preference !== null &&
      query.isSuccess &&
      !selected,
    storageAvailable: context.storageAvailable,
    refetch: query.refetch,
    switchBranch,
    pending,
    setPending,
    notice,
    cartItemCount: context.cartItemCount,
  };
}
