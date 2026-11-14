'use client';

import type { Dispatch, SetStateAction } from 'react';

import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import type {
  AdminCatalogStatus,
  AdminProductType,
  ProductDialogFormState,
} from '@/types/admin-catalog';

interface AdminProductDialogFieldsProps {
  formState: ProductDialogFormState;
  setFormState: Dispatch<SetStateAction<ProductDialogFormState>>;
  onNameChange: (nextName: string) => void;
  fieldErrors: Record<string, string[]>;
}

/** Input fields for creating or editing a catalog product inside the admin modal dialog. */
export function AdminProductDialogFields({
  formState,
  setFormState,
  onNameChange,
  fieldErrors,
}: AdminProductDialogFieldsProps) {
  return (
    <>
      <FormField
        label={ADMIN_CATALOG_COPY.PRODUCTS.NAME_LABEL}
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
        label={ADMIN_CATALOG_COPY.PRODUCTS.SLUG_LABEL}
        required={formState.mode === 'create'}
        helper={
          formState.mode === 'create'
            ? ADMIN_CATALOG_COPY.PRODUCTS.SLUG_HELP_CREATE
            : ADMIN_CATALOG_COPY.PRODUCTS.SLUG_HELP_LOCKED
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
              setFormState((prev) => ({
                ...prev,
                slug: event.target.value,
                slugTouched: true,
              }))
            }
          />
        )}
      </FormField>

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
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  productType: event.target.value as AdminProductType,
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
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  sortOrder: event.target.value,
                }))
              }
            />
          )}
        </FormField>
      </div>

      {formState.mode === 'edit' ? (
        <FormField
          label={ADMIN_CATALOG_COPY.PRODUCTS.STATUS_LABEL}
          required
          error={fieldErrors.status?.[0]}
        >
          {(props) => (
            <Select
              {...props}
              value={formState.status}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  status: event.target.value as AdminCatalogStatus,
                }))
              }
            >
              <option value="draft">
                {ADMIN_CATALOG_COPY.PRODUCTS.STATUS_LABELS.draft}
              </option>
              <option value="published">
                {ADMIN_CATALOG_COPY.PRODUCTS.STATUS_LABELS.published}
              </option>
              <option value="archived">
                {ADMIN_CATALOG_COPY.PRODUCTS.STATUS_LABELS.archived}
              </option>
            </Select>
          )}
        </FormField>
      ) : null}

      <FormField
        label={ADMIN_CATALOG_COPY.PRODUCTS.SHORT_DESC_LABEL}
        error={fieldErrors.shortDescription?.[0]}
      >
        {(props) => (
          <Input
            {...props}
            value={formState.shortDescription}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                shortDescription: event.target.value,
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
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                description: event.target.value,
              }))
            }
          />
        )}
      </FormField>

      <FormField
        label={ADMIN_CATALOG_COPY.PRODUCTS.INGREDIENTS_LABEL}
        error={fieldErrors.ingredientsInfo?.[0]}
      >
        {(props) => (
          <Textarea
            {...props}
            rows={2}
            value={formState.ingredientsInfo}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                ingredientsInfo: event.target.value,
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
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                storageInstructions: event.target.value,
              }))
            }
          />
        )}
      </FormField>

      <div className="admin-checkbox-group">
        <label className="admin-checkbox-label">
          <input
            type="checkbox"
            checked={formState.needsOwnerReview}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                needsOwnerReview: event.target.checked,
              }))
            }
          />
          <span>{ADMIN_CATALOG_COPY.PRODUCTS.REVIEW_CHECKBOX}</span>
        </label>

        <label className="admin-checkbox-label">
          <input
            type="checkbox"
            checked={formState.isFeatured}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                isFeatured: event.target.checked,
              }))
            }
          />
          <span>{ADMIN_CATALOG_COPY.PRODUCTS.FEATURED_CHECKBOX}</span>
        </label>

        <label className="admin-checkbox-label">
          <input
            type="checkbox"
            checked={formState.isBestSeller}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                isBestSeller: event.target.checked,
              }))
            }
          />
          <span>{ADMIN_CATALOG_COPY.PRODUCTS.BEST_SELLER_CHECKBOX}</span>
        </label>

        <label className="admin-checkbox-label">
          <input
            type="checkbox"
            checked={formState.isNew}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                isNew: event.target.checked,
              }))
            }
          />
          <span>{ADMIN_CATALOG_COPY.PRODUCTS.NEW_CHECKBOX}</span>
        </label>
      </div>
    </>
  );
}
