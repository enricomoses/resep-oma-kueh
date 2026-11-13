'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

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
import { useCreateAdminProduct } from '@/hooks/use-admin-catalog';
import { ApiClientError } from '@/lib/errors';
import type { AdminProductType } from '@/types/admin-catalog';
import { cn } from '@/utils';
import {
  buildAdminProductEditRoute,
  slugifyCatalogName,
} from '@/utils/admin-catalog';
import { createAdminProductSchema } from '@/validations/admin-catalog.schema';

interface AdminProductCreateViewProps {
  className?: string;
}

export function AdminProductCreateView({
  className,
}: AdminProductCreateViewProps) {
  const router = useRouter();
  const createMutation = useCreateAdminProduct();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [productType, setProductType] = useState<AdminProductType>('simple');
  const [sortOrder, setSortOrder] = useState('0');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [ingredientsInfo, setIngredientsInfo] = useState('');
  const [storageInstructions, setStorageInstructions] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) {
      setSlug(slugifyCatalogName(value));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const parsedSort = Number.parseInt(sortOrder, 10);
    const candidate = {
      name,
      slug,
      productType,
      shortDescription: shortDescription.trim() || null,
      description: description.trim() || null,
      ingredientsInfo: ingredientsInfo.trim() || null,
      storageInstructions: storageInstructions.trim() || null,
      isFeatured,
      isBestSeller,
      isNew,
      needsOwnerReview: true,
      sortOrder: Number.isFinite(parsedSort) ? parsedSort : 0,
    };

    const validated = createAdminProductSchema.safeParse(candidate);
    if (!validated.success) {
      const nextErrors: Record<string, string[]> = {};
      for (const issue of validated.error.issues) {
        const key = issue.path[0] ? String(issue.path[0]) : 'root';
        nextErrors[key] = nextErrors[key] ?? [];
        nextErrors[key].push(issue.message);
      }
      setFieldErrors(nextErrors);
      setFormError('Periksa data inti produk sebelum melanjutkan.');
      return;
    }

    try {
      const result = await createMutation.mutateAsync(validated.data);
      router.push(buildAdminProductEditRoute(result.data.product.id));
    } catch (err) {
      if (err instanceof ApiClientError) {
        setFieldErrors(err.fieldErrors ?? {});
        setFormError(err.message);
      } else {
        setFormError('Gagal membuat draf produk baru.');
      }
    }
  }

  return (
    <section className={cn('admin-section', className)}>
      <div className="admin-section-header">
        <div>
          <ActionLink href={ROUTES.ADMIN_PRODUCTS} variant="ghost" size="sm">
            <ArrowLeft size={15} aria-hidden="true" />
            <span>{ADMIN_CATALOG_COPY.PRODUCT_EDITOR.BACK_TO_PRODUCTS}</span>
          </ActionLink>
          <h2 className="admin-section-title">
            {ADMIN_CATALOG_COPY.PRODUCT_EDITOR.CREATE_PAGE_TITLE}
          </h2>
          <p className="admin-section-subtitle">
            {ADMIN_CATALOG_COPY.PRODUCT_EDITOR.CREATE_STEP_DESC}
          </p>
        </div>
      </div>

      <Card>
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="admin-form"
          noValidate
        >
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
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
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
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setSlugTouched(true);
                  }}
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
                  value={productType}
                  onChange={(e) =>
                    setProductType(e.target.value as AdminProductType)
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
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
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
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
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
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
                  value={ingredientsInfo}
                  onChange={(e) => setIngredientsInfo(e.target.value)}
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
                  value={storageInstructions}
                  onChange={(e) => setStorageInstructions(e.target.value)}
                />
              )}
            </FormField>
          </div>

          <div className="admin-checkbox-group">
            <label className="admin-checkbox-label">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
              />
              <span>{ADMIN_CATALOG_COPY.PRODUCTS.FEATURED_CHECKBOX}</span>
            </label>
            <label className="admin-checkbox-label">
              <input
                type="checkbox"
                checked={isBestSeller}
                onChange={(e) => setIsBestSeller(e.target.checked)}
              />
              <span>{ADMIN_CATALOG_COPY.PRODUCTS.BEST_SELLER_CHECKBOX}</span>
            </label>
            <label className="admin-checkbox-label">
              <input
                type="checkbox"
                checked={isNew}
                onChange={(e) => setIsNew(e.target.checked)}
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
              loading={createMutation.isPending}
              loadingLabel="Menyimpan draf..."
            >
              Buat Draf &amp; Lanjut Konfigurasi SKU
            </Button>
          </div>
        </form>
      </Card>
    </section>
  );
}
