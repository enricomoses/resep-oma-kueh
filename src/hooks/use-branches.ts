'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useRef, useState } from 'react';

import { BRANCH, SITE_COPY } from '@/constants/site.constant';
import { useBranchesQuery } from '@/hooks/queries/use-branches';
import { notifyError, notifySuccess, notifyWarning } from '@/lib/toast';
import {
  useBranchContext,
  useBranchPreference,
} from '@/providers/branch-provider';
import type { PublicBranch } from '@/types/branch';
import { withBranch } from '@/utils/branch-url';

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
  const query = useBranchesQuery(code, serverInitialData);
  // Match SSR HTML on initial hydration render even when Suspense siblings resolve React Query first.
  const canExposeClientQuery = context.hydrated || hasServerInitial;
  const data = canExposeClientQuery ? query.data : undefined;
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
        notifyError(SITE_COPY.SWITCH_BLOCKED, {
          toastId: 'branch-switch-notice',
        });
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
        notifyError(SITE_COPY.SWITCH_BLOCKED, {
          toastId: 'branch-switch-notice',
        });
        return;
      }
      try {
        context.store.getState().setSelectedBranchId(next.id);
      } catch {
        setNotice(SITE_COPY.STORAGE_UNAVAILABLE);
        notifyWarning(SITE_COPY.STORAGE_UNAVAILABLE, {
          toastId: 'branch-storage-notice',
        });
      }
      router.replace(withBranch(`${pathname}?${params}`, next.code), {
        scroll: false,
      });
      setPending(null);
      notifySuccess(`Cabang aktif dialihkan ke ${next.name}.`, {
        toastId: 'branch-switched',
      });
    } catch {
      setNotice(SITE_COPY.SWITCH_BLOCKED);
      notifyError(SITE_COPY.SWITCH_BLOCKED, {
        toastId: 'branch-switch-notice',
      });
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
    isFetching: canExposeClientQuery ? query.isFetching : false,
    isError: canExposeClientQuery ? query.isError : false,
    errorUpdatedAt: canExposeClientQuery ? query.errorUpdatedAt : 0,
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
