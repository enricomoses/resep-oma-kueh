'use client';
import { SITE_COPY } from '@/constants/site.constant';
import { useBranches } from '@/hooks/use-branches';
import { cn } from '@/utils';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Select } from '@/components/ui/select';

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
  return (
    <div className={cn('branch-selector', className)}>
      <FormField
        label={SITE_COPY.SELECT_BRANCH}
        helper={SITE_COPY.BRANCH_HELP}
        error={message}
      >
        {(props) => (
          <Select
            {...props}
            value={state.selected?.id ?? ''}
            disabled={
              !state.hydrated ||
              state.isPending ||
              state.isError ||
              state.isEmpty
            }
            onChange={(event) => {
              const branch = state.items.find(
                (item) => item.id === event.target.value,
              );
              if (branch) void state.switchBranch(branch);
            }}
          >
            <option value="" disabled>
              {state.hydrated
                ? state.isPending
                  ? SITE_COPY.LOADING_BRANCHES
                  : SITE_COPY.UNSELECTED
                : SITE_COPY.HYDRATING}
            </option>
            {state.items.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </Select>
        )}
      </FormField>
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
