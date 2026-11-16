'use client';

import { MapPin, RotateCw } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { DropdownSelect } from '@/components/ui/dropdown-select';
import { SITE_COPY } from '@/constants/site.constant';
import { useBranches } from '@/hooks/use-branches';
import { dismissToast, notifyError, notifyWarning } from '@/lib/toast';
import { cn } from '@/utils';

const BRANCH_STATUS_TOAST_ID = 'branch-status-notice';

interface BranchSelectorProps {
  className?: string;
}

export function BranchSelector({ className }: BranchSelectorProps) {
  const state = useBranches();
  const lastNotifiedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const statusAlert = state.isError
      ? {
          key: `error:${state.errorUpdatedAt}`,
          type: 'error' as const,
          text: SITE_COPY.BRANCH_ERROR,
        }
      : state.isEmpty
        ? {
            key: 'empty',
            type: 'warning' as const,
            text: SITE_COPY.BRANCH_EMPTY,
          }
        : state.invalidUrl
          ? {
              key: `invalid-url:${state.code ?? ''}`,
              type: 'warning' as const,
              text: SITE_COPY.BRANCH_INVALID,
            }
          : state.invalidPreference
            ? {
                key: 'invalid-preference',
                type: 'warning' as const,
                text: SITE_COPY.PREFERENCE_INVALID,
              }
            : !state.storageAvailable
              ? {
                  key: 'storage-unavailable',
                  type: 'warning' as const,
                  text: SITE_COPY.STORAGE_UNAVAILABLE,
                }
              : null;

    if (!statusAlert) {
      if (lastNotifiedKeyRef.current !== null) {
        dismissToast(BRANCH_STATUS_TOAST_ID);
        lastNotifiedKeyRef.current = null;
      }
      return;
    }

    if (lastNotifiedKeyRef.current === statusAlert.key) return;
    lastNotifiedKeyRef.current = statusAlert.key;

    if (statusAlert.type === 'error') {
      notifyError(statusAlert.text, { toastId: BRANCH_STATUS_TOAST_ID });
      return;
    }

    notifyWarning(statusAlert.text, { toastId: BRANCH_STATUS_TOAST_ID });
  }, [
    state.isError,
    state.errorUpdatedAt,
    state.isEmpty,
    state.invalidUrl,
    state.code,
    state.invalidPreference,
    state.storageAvailable,
  ]);

  const placeholder = state.hydrated
    ? state.isPending
      ? SITE_COPY.LOADING_BRANCHES
      : SITE_COPY.UNSELECTED
    : SITE_COPY.HYDRATING;

  const options = state.items.map((branch) => ({
    value: branch.id,
    label: branch.name,
  }));

  return (
    <div className={cn('branch-selector', className)}>
      {state.isError ? (
        <Button
          variant="secondary"
          size="sm"
          className="branch-retry-button"
          disabled={state.isFetching}
          aria-busy={state.isFetching || undefined}
          onClick={() => void state.refetch()}
        >
          <RotateCw
            size={14}
            aria-hidden="true"
            className={cn(state.isFetching && 'branch-retry-icon--spinning')}
          />
          <span>{SITE_COPY.RETRY}</span>
        </Button>
      ) : (
        <DropdownSelect
          aria-label={SITE_COPY.SELECT_BRANCH}
          leadingIcon={<MapPin size={15} />}
          options={options}
          value={state.selected?.id ?? ''}
          placeholder={placeholder}
          disabled={!state.hydrated || state.isPending || state.isEmpty}
          onChange={(branchId) => {
            const branch = state.items.find((item) => item.id === branchId);
            if (branch) void state.switchBranch(branch);
          }}
        />
      )}
      <Dialog
        open={state.pending !== null}
        onOpenChange={(open) => {
          if (!open) state.setPending(null);
        }}
        title={SITE_COPY.SWITCH_TITLE}
        description={SITE_COPY.SWITCH_BODY}
      >
        <div className="site-dialog-actions">
          <Button
            onClick={() => {
              if (state.pending) void state.switchBranch(state.pending, true);
            }}
          >
            {SITE_COPY.SWITCH_CONTINUE}
          </Button>
          <Button variant="secondary" onClick={() => state.setPending(null)}>
            {SITE_COPY.CANCEL}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
