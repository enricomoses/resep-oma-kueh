'use client';

import { ArrowLeft } from 'lucide-react';

import { AdminSectionHeader } from '@/app/admin/(dashboard)/_components/admin-section-header';
import { ActionLink } from '@/components/ui/action-link';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { ROUTES } from '@/constants/routes.constant';
import { useAdminProductCreate } from '@/hooks/use-admin-product-create';
import { cn } from '@/utils';

import { AdminProductCreateForm } from './admin-product-create-form';

interface AdminProductCreateViewProps {
  className?: string;
}

/** Thin composition view for step-1 draft product creation. */
export function AdminProductCreateView({
  className,
}: AdminProductCreateViewProps) {
  const {
    formState,
    setFormState,
    formError,
    fieldErrors,
    isPending,
    handleNameChange,
    handleSlugChange,
    handleSubmit,
  } = useAdminProductCreate();

  return (
    <section className={cn('admin-section', className)}>
      <AdminSectionHeader
        leading={
          <ActionLink href={ROUTES.ADMIN_PRODUCTS} variant="ghost" size="sm">
            <ArrowLeft size={15} aria-hidden="true" />
            <span>{ADMIN_CATALOG_COPY.PRODUCT_EDITOR.BACK_TO_PRODUCTS}</span>
          </ActionLink>
        }
        title={ADMIN_CATALOG_COPY.PRODUCT_EDITOR.CREATE_PAGE_TITLE}
        description={ADMIN_CATALOG_COPY.PRODUCT_EDITOR.CREATE_STEP_DESC}
      />

      <AdminProductCreateForm
        formState={formState}
        setFormState={setFormState}
        formError={formError}
        fieldErrors={fieldErrors}
        isPending={isPending}
        onNameChange={handleNameChange}
        onSlugChange={handleSlugChange}
        onSubmit={(e) => void handleSubmit(e)}
      />
    </section>
  );
}
