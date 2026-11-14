'use client';

import type { Dispatch, SetStateAction } from 'react';

import { Card } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import type {
  AdminCatalogStatus,
  AdminProductType,
  ProductEditorFormState,
} from '@/types/admin-catalog';
import { cn } from '@/utils';

interface AdminProductBasicCardProps {
  slug: string;
  formState: ProductEditorFormState;
  setFormState: Dispatch<SetStateAction<ProductEditorFormState>>;
  fieldErrors: Record<string, string[]>;
  className?: string;
}

export function AdminProductBasicCard({
  slug,
  formState,
  setFormState,
  fieldErrors,
  className,
}: AdminProductBasicCardProps) {
  return (
    <Card className={cn('admin-editor-item-card', className)}>
      <h3 className="admin-editor-heading">Informasi Inti Produk</h3>

      <div className="admin-form-row-2">
        <FormField
          label={ADMIN_CATALOG_COPY.PRODUCTS.NAME_LABEL}
          required
          error={fieldErrors['product.name']?.[0]}
        >
          {(props) => (
            <Input
              {...props}
              value={formState.name}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
            />
          )}
        </FormField>

        <FormField label={ADMIN_CATALOG_COPY.PRODUCTS.SLUG_LABEL}>
          {(props) => <Input {...props} value={slug} readOnly disabled />}
        </FormField>
      </div>

      <div className="admin-form-row-3">
        <FormField
          label={ADMIN_CATALOG_COPY.PRODUCTS.TYPE_LABEL}
          required
          error={fieldErrors['product.productType']?.[0]}
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
          label={ADMIN_CATALOG_COPY.PRODUCTS.STATUS_LABEL}
          required
          error={fieldErrors['product.status']?.[0]}
        >
          {(props) => (
            <Select
              {...props}
              value={formState.status}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  status: e.target.value as AdminCatalogStatus,
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

        <FormField
          label={ADMIN_CATALOG_COPY.PRODUCTS.SORT_LABEL}
          required
          error={fieldErrors['product.sortOrder']?.[0]}
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
        error={fieldErrors['product.shortDescription']?.[0]}
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
        error={fieldErrors['product.description']?.[0]}
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
        <FormField label={ADMIN_CATALOG_COPY.PRODUCTS.INGREDIENTS_LABEL}>
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

        <FormField label={ADMIN_CATALOG_COPY.PRODUCTS.STORAGE_LABEL}>
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
            checked={formState.needsOwnerReview}
            onChange={(e) =>
              setFormState((prev) => ({
                ...prev,
                needsOwnerReview: e.target.checked,
              }))
            }
          />
          <span>{ADMIN_CATALOG_COPY.PRODUCTS.REVIEW_CHECKBOX}</span>
        </label>

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
    </Card>
  );
}
