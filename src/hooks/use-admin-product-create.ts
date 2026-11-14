'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

import { extractAdminMutationError } from '@/lib/errors';
import type { AdminProductType } from '@/types/admin-catalog';
import {
  buildAdminProductEditRoute,
  slugifyCatalogName,
} from '@/utils/admin-catalog';
import { createAdminProductSchema } from '@/validations/admin-catalog.schema';

import { useCreateAdminProduct } from './use-admin-catalog';

export interface ProductCreateFormState {
  name: string;
  slug: string;
  slugTouched: boolean;
  productType: AdminProductType;
  sortOrder: string;
  shortDescription: string;
  description: string;
  ingredientsInfo: string;
  storageInstructions: string;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNew: boolean;
}

const INITIAL_CREATE_STATE: ProductCreateFormState = {
  name: '',
  slug: '',
  slugTouched: false,
  productType: 'simple',
  sortOrder: '0',
  shortDescription: '',
  description: '',
  ingredientsInfo: '',
  storageInstructions: '',
  isFeatured: false,
  isBestSeller: false,
  isNew: false,
};

/** Controller hook for step-1 draft product creation and redirect to configuration editor. */
export function useAdminProductCreate() {
  const router = useRouter();
  const createMutation = useCreateAdminProduct();

  const [formState, setFormState] =
    useState<ProductCreateFormState>(INITIAL_CREATE_STATE);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  function handleNameChange(value: string) {
    setFormState((prev) => ({
      ...prev,
      name: value,
      slug: !prev.slugTouched ? slugifyCatalogName(value) : prev.slug,
    }));
  }

  function handleSlugChange(value: string) {
    setFormState((prev) => ({
      ...prev,
      slug: value,
      slugTouched: true,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const parsedSort = Number.parseInt(formState.sortOrder, 10);
    const candidate = {
      name: formState.name,
      slug: formState.slug,
      productType: formState.productType,
      shortDescription: formState.shortDescription.trim() || null,
      description: formState.description.trim() || null,
      ingredientsInfo: formState.ingredientsInfo.trim() || null,
      storageInstructions: formState.storageInstructions.trim() || null,
      isFeatured: formState.isFeatured,
      isBestSeller: formState.isBestSeller,
      isNew: formState.isNew,
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
      const parsed = extractAdminMutationError(
        err,
        'Gagal membuat draf produk baru.',
      );
      setFieldErrors(parsed.fields);
      setFormError(parsed.message);
    }
  }

  return {
    formState,
    setFormState,
    formError,
    fieldErrors,
    isPending: createMutation.isPending,
    handleNameChange,
    handleSlugChange,
    handleSubmit,
  };
}
