'use client';

import type { Dispatch, FormEvent, SetStateAction } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Feedback } from '@/components/ui/feedback';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import type { ProductDialogFormState } from '@/types/admin-catalog';

import { AdminProductDialogFields } from './admin-product-dialog-fields';

interface AdminProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formState: ProductDialogFormState;
  setFormState: Dispatch<SetStateAction<ProductDialogFormState>>;
  onNameChange: (nextName: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReloadLatest: () => void;
  conflictBanner: string | null;
  formError: string | null;
  fieldErrors: Record<string, string[]>;
  isSaving: boolean;
}

/** Modal dialog for creating or quick-editing a catalog product. */
export function AdminProductDialog({
  open,
  onOpenChange,
  formState,
  setFormState,
  onNameChange,
  onSubmit,
  onReloadLatest,
  conflictBanner,
  formError,
  fieldErrors,
  isSaving,
}: AdminProductDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        formState.mode === 'create'
          ? ADMIN_CATALOG_COPY.PRODUCTS.FORM_CREATE_TITLE
          : ADMIN_CATALOG_COPY.PRODUCTS.FORM_EDIT_TITLE
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

        {formState.mode === 'edit' && formState.readiness ? (
          <Feedback
            tone="info"
            title={ADMIN_CATALOG_COPY.PRODUCTS.PUBLISH_READY_LABEL}
          >
            {formState.readiness.isPublishReady ? (
              ADMIN_CATALOG_COPY.PRODUCTS.PUBLISH_READY_OK
            ) : (
              <ul className="admin-readiness-list">
                {formState.readiness.missingReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            )}
          </Feedback>
        ) : null}

        <AdminProductDialogFields
          formState={formState}
          setFormState={setFormState}
          onNameChange={onNameChange}
          fieldErrors={fieldErrors}
        />

        <div className="admin-modal-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            {ADMIN_CATALOG_COPY.PRODUCTS.CANCEL}
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSaving}
            loadingLabel="Menyimpan..."
          >
            {formState.mode === 'create'
              ? ADMIN_CATALOG_COPY.PRODUCTS.SAVE_CREATE
              : ADMIN_CATALOG_COPY.PRODUCTS.SAVE_EDIT}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
