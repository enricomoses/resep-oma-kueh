'use client';

import type { Dispatch, FormEvent, SetStateAction } from 'react';

import { ActionLink } from '@/components/ui/action-link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { ROUTES } from '@/constants/routes.constant';
import type { ProductCreateFormState } from '@/hooks/use-admin-product-create';
import type { AdminProductType } from '@/types/admin-catalog';

interface AdminProductCreateFormProps {
  formState: ProductCreateFormState;
  setFormState: Dispatch<SetStateAction<ProductCreateFormState>>;
  formError: string | null;
  fieldErrors: Record<string, string[]>;
  isPending: boolean;
  onNameChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

/** Step-1 form card for creating a draft bakery product before full SKU configuration. */
export function AdminProductCreateForm({
  formState,
  setFormState,
  formError,
  fieldErrors,
  isPending,
  onNameChange,
  onSlugChange,
  onSubmit,
}: AdminProductCreateFormProps) {
  return (
    <Card>
      <form onSubmit={onSubmit} className="admin-form" noValidate>
        {formError ? (
          <Feedback tone="error" title={formError} announce />
        ) : null}

        <div className="admin-form-row-2">
          <FormField
            label={ADMIN_CATALOG_COPY.PRODUCTS.NAME_LABEL}
            required
            error={fieldErrors.name?.[0]}
          >
            {(props) => (
              <Input
                {...props}
                value={formState.name}
                onChange={(e) => onNameChange(e.target.value)}
              />
            )}
          </FormField>

          <FormField
            label={ADMIN_CATALOG_COPY.PRODUCTS.SLUG_LABEL}
            required
            helper={ADMIN_CATALOG_COPY.PRODUCTS.SLUG_HELP_CREATE}
            error={fieldErrors.slug?.[0]}
          >
            {(props) => (
              <Input
                {...props}
                value={formState.slug}
                onChange={(e) => onSlugChange(e.target.value)}
              />
            )}
          </FormField>
        </div>

        <div className="admin-form-row-2">
          <FormField
            label={ADMIN_CATALOG_COPY.PRODUCTS.TYPE_LABEL}
            required
            error={fieldErrors.productType?.[0]}
          >
            {(props) => (
              <Select
                {...props}
                value={formState.productType}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    productType: e.target.value as AdminProductType,
                  }))
                }
              >
                <option value="simple">
                  {ADMIN_CATALOG_COPY.PRODUCTS.TYPE_LABELS.simple}
                </option>
                <option value="variants">
                  {ADMIN_CATALOG_COPY.PRODUCTS.TYPE_LABELS.variants}
                </option>
                <option value="bundle">
                  {ADMIN_CATALOG_COPY.PRODUCTS.TYPE_LABELS.bundle}
                </option>
              </Select>
            )}
          </FormField>

          <FormField
            label={ADMIN_CATALOG_COPY.PRODUCTS.SORT_LABEL}
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
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    sortOrder: e.target.value,
                  }))
                }
              />
            )}
          </FormField>
        </div>

        <FormField
          label={ADMIN_CATALOG_COPY.PRODUCTS.SHORT_DESC_LABEL}
          error={fieldErrors.shortDescription?.[0]}
        >
          {(props) => (
            <Input
              {...props}
              value={formState.shortDescription}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  shortDescription: e.target.value,
                }))
              }
            />
          )}
        </FormField>

        <FormField
          label={ADMIN_CATALOG_COPY.PRODUCTS.DESC_LABEL}
          error={fieldErrors.description?.[0]}
        >
          {(props) => (
            <Textarea
              {...props}
              rows={3}
              value={formState.description}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
          )}
        </FormField>

        <div className="admin-form-row-2">
          <FormField
            label={ADMIN_CATALOG_COPY.PRODUCTS.INGREDIENTS_LABEL}
            error={fieldErrors.ingredientsInfo?.[0]}
          >
            {(props) => (
              <Textarea
                {...props}
                rows={2}
                value={formState.ingredientsInfo}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    ingredientsInfo: e.target.value,
                  }))
                }
              />
            )}
          </FormField>

          <FormField
            label={ADMIN_CATALOG_COPY.PRODUCTS.STORAGE_LABEL}
            error={fieldErrors.storageInstructions?.[0]}
          >
            {(props) => (
              <Textarea
                {...props}
                rows={2}
                value={formState.storageInstructions}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    storageInstructions: e.target.value,
                  }))
                }
              />
            )}
          </FormField>
        </div>

        <div className="admin-checkbox-group">
          <label className="admin-checkbox-label">
            <input
              type="checkbox"
              checked={formState.isFeatured}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  isFeatured: e.target.checked,
                }))
              }
            />
            <span>{ADMIN_CATALOG_COPY.PRODUCTS.FEATURED_CHECKBOX}</span>
          </label>
          <label className="admin-checkbox-label">
            <input
              type="checkbox"
              checked={formState.isBestSeller}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  isBestSeller: e.target.checked,
                }))
              }
            />
            <span>{ADMIN_CATALOG_COPY.PRODUCTS.BEST_SELLER_CHECKBOX}</span>
          </label>
          <label className="admin-checkbox-label">
            <input
              type="checkbox"
              checked={formState.isNew}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  isNew: e.target.checked,
                }))
              }
            />
            <span>{ADMIN_CATALOG_COPY.PRODUCTS.NEW_CHECKBOX}</span>
          </label>
        </div>

        <div className="admin-dialog-actions">
          <ActionLink href={ROUTES.ADMIN_PRODUCTS} variant="ghost" size="sm">
            {ADMIN_CATALOG_COPY.PRODUCTS.CANCEL}
          </ActionLink>
          <Button
            type="submit"
            variant="primary"
            loading={isPending}
            loadingLabel="Menyimpan draf..."
          >
            Buat Draf &amp; Lanjut Konfigurasi SKU
          </Button>
        </div>
      </form>
    </Card>
  );
}
