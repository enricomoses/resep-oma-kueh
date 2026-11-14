'use client';

import { MapPin } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { DropdownSelect } from '@/components/ui/dropdown-select';
import { SITE_COPY } from '@/constants/site.constant';
import { useBranches } from '@/hooks/use-branches';
import { cn } from '@/utils';

interface BranchSelectorProps {
  className?: string;
}

export function BranchSelector({ className }: BranchSelectorProps) {
  const state = useBranches();
  const message = state.isError
    ? SITE_COPY.BRANCH_ERROR
    : state.isEmpty
      ? SITE_COPY.BRANCH_EMPTY
      : state.invalidUrl
        ? SITE_COPY.BRANCH_INVALID
        : state.invalidPreference
          ? SITE_COPY.PREFERENCE_INVALID
          : !state.storageAvailable
            ? SITE_COPY.STORAGE_UNAVAILABLE
            : undefined;

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
      <DropdownSelect
        aria-label={SITE_COPY.SELECT_BRANCH}
        leadingIcon={<MapPin size={15} />}
        options={options}
        value={state.selected?.id ?? ''}
        placeholder={placeholder}
        disabled={
          !state.hydrated ||
          state.isPending ||
          state.isError ||
          state.isEmpty
        }
        onChange={(branchId) => {
          const branch = state.items.find((item) => item.id === branchId);
          if (branch) void state.switchBranch(branch);
        }}
      />
      {message ? (
        <p role="alert" className="ui-field-error">
          {message}
        </p>
      ) : null}
      {state.isError ? (
        <Button variant="secondary" onClick={() => void state.refetch()}>
          {SITE_COPY.RETRY}
        </Button>
      ) : null}
      {state.notice ? (
        <p role="status" className="ui-field-note">
          {state.notice}
        </p>
      ) : null}
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
