'use client';

import type { FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Feedback } from '@/components/ui/feedback';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import type {
  AdminCatalogStatus,
  AdminCategoryItem,
  CategoryFormState,
} from '@/types/admin-catalog';

interface AdminCategoryEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formState: CategoryFormState;
  items: AdminCategoryItem[];
  conflictBanner: string | null;
  formError: string | null;
  fieldErrors: Record<string, string[]>;
  isSaving: boolean;
  onNameChange: (nextName: string) => void;
  onFormStateChange: (
    updater: (prev: CategoryFormState) => CategoryFormState,
  ) => void;
  onReloadLatest: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function AdminCategoryEditorDialog({
  open,
  onOpenChange,
  formState,
  items,
  conflictBanner,
  formError,
  fieldErrors,
  isSaving,
  onNameChange,
  onFormStateChange,
  onReloadLatest,
  onSubmit,
}: AdminCategoryEditorDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        formState.mode === 'create'
          ? ADMIN_CATALOG_COPY.CATEGORIES.FORM_CREATE_TITLE
          : ADMIN_CATALOG_COPY.CATEGORIES.FORM_EDIT_TITLE
      }
    >
      <form onSubmit={onSubmit} className="admin-modal-form">
        {conflictBanner ? (
          <Feedback tone="error" title={conflictBanner} announce>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onReloadLatest}
            >
              Muat ulang data terbaru
            </Button>
          </Feedback>
        ) : formError ? (
          <Feedback tone="error" title={formError} announce />
        ) : null}

        <FormField
          label={ADMIN_CATALOG_COPY.CATEGORIES.NAME_LABEL}
          required
          error={fieldErrors.name?.[0]}
        >
          {(props) => (
            <Input
              {...props}
              value={formState.name}
              onChange={(event) => onNameChange(event.target.value)}
            />
          )}
        </FormField>

        <FormField
          label={ADMIN_CATALOG_COPY.CATEGORIES.SLUG_LABEL}
          required={formState.mode === 'create'}
          helper={
            formState.mode === 'create'
              ? ADMIN_CATALOG_COPY.CATEGORIES.SLUG_HELP_CREATE
              : ADMIN_CATALOG_COPY.CATEGORIES.SLUG_HELP_LOCKED
          }
          error={fieldErrors.slug?.[0]}
        >
          {(props) => (
            <Input
              {...props}
              value={formState.slug}
              readOnly={formState.mode === 'edit'}
              disabled={formState.mode === 'edit'}
              onChange={(event) =>
                onFormStateChange((prev) => ({
                  ...prev,
                  slug: event.target.value,
                  slugTouched: true,
                }))
              }
            />
          )}
        </FormField>

        <FormField
          label={ADMIN_CATALOG_COPY.CATEGORIES.PARENT_LABEL}
          error={fieldErrors.parentId?.[0]}
        >
          {(props) => (
            <Select
              {...props}
              value={formState.parentId}
              onChange={(event) =>
                onFormStateChange((prev) => ({
                  ...prev,
                  parentId: event.target.value,
                }))
              }
            >
              <option value="">
                {ADMIN_CATALOG_COPY.CATEGORIES.PARENT_NONE}
              </option>
              {items
                .filter((candidate) => candidate.id !== formState.id)
                .map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.name} (
                    {
                      ADMIN_CATALOG_COPY.CATEGORIES.STATUS_LABELS[
                        candidate.status
                      ]
                    }
                    )
                  </option>
                ))}
            </Select>
          )}
        </FormField>

        <div className="admin-form-row-2">
          <FormField
            label={ADMIN_CATALOG_COPY.CATEGORIES.SORT_LABEL}
            required
            error={fieldErrors.sortOrder?.[0]}
          >
            {(props) => (
              <Input
                {...props}
                type="number"
                min={0}
                max={9999}
                value={formState.sortOrder}
                onChange={(event) =>
                  onFormStateChange((prev) => ({
                    ...prev,
                    sortOrder: event.target.value,
                  }))
                }
              />
            )}
          </FormField>

          <FormField
            label={ADMIN_CATALOG_COPY.CATEGORIES.STATUS_LABEL}
            required
            error={fieldErrors.status?.[0]}
          >
            {(props) => (
              <Select
                {...props}
                value={formState.status}
                onChange={(event) =>
                  onFormStateChange((prev) => ({
                    ...prev,
                    status: event.target.value as AdminCatalogStatus,
                  }))
                }
              >
                <option value="draft">
                  {ADMIN_CATALOG_COPY.CATEGORIES.STATUS_LABELS.draft}
                </option>
                <option value="published">
                  {ADMIN_CATALOG_COPY.CATEGORIES.STATUS_LABELS.published}
                </option>
                {formState.mode === 'edit' ? (
                  <option value="archived">
                    {ADMIN_CATALOG_COPY.CATEGORIES.STATUS_LABELS.archived}
                  </option>
                ) : null}
              </Select>
            )}
          </FormField>
        </div>

        <FormField
          label={ADMIN_CATALOG_COPY.CATEGORIES.DESC_LABEL}
          error={fieldErrors.description?.[0]}
        >
          {(props) => (
            <Textarea
              {...props}
              rows={3}
              value={formState.description}
              onChange={(event) =>
                onFormStateChange((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
            />
          )}
        </FormField>

        <div className="admin-modal-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            {ADMIN_CATALOG_COPY.CATEGORIES.CANCEL}
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSaving}
            loadingLabel="Menyimpan..."
          >
            {formState.mode === 'create'
              ? ADMIN_CATALOG_COPY.CATEGORIES.SAVE_CREATE
              : ADMIN_CATALOG_COPY.CATEGORIES.SAVE_EDIT}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
