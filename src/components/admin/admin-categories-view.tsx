'use client';

import { Archive, CheckCircle2, Pencil, Plus, RefreshCw } from 'lucide-react';
import { type FormEvent, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Feedback } from '@/components/ui/feedback';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import {
  useAdminCategories,
  useArchiveAdminCategory,
  useCreateAdminCategory,
  useUpdateAdminCategory,
} from '@/hooks/use-admin-catalog';
import { ApiClientError } from '@/lib/errors';
import type {
  AdminCatalogStatus,
  AdminCategoryItem,
  AdminCategoryListResponse,
} from '@/types/admin-catalog';
import type { AdminSessionProfile } from '@/types/auth';
import { cn } from '@/utils';
import {
  slugifyCatalogName,
  wouldCreateCategoryCycle,
} from '@/utils/admin-catalog';
import {
  createAdminCategorySchema,
  updateAdminCategorySchema,
} from '@/validations/admin-catalog.schema';

interface AdminCategoriesViewProps {
  profile: AdminSessionProfile;
  initialCategories: AdminCategoryListResponse;
  className?: string;
}

interface CategoryFormState {
  mode: 'create' | 'edit';
  id: string | null;
  name: string;
  slug: string;
  slugTouched: boolean;
  parentId: string;
  description: string;
  sortOrder: string;
  status: AdminCatalogStatus;
  expectedUpdatedAt: string | null;
}

function createInitialFormState(): CategoryFormState {
  return {
    mode: 'create',
    id: null,
    name: '',
    slug: '',
    slugTouched: false,
    parentId: '',
    description: '',
    sortOrder: '0',
    status: 'draft',
    expectedUpdatedAt: null,
  };
}

function getStatusBadgeTone(status: AdminCatalogStatus) {
  if (status === 'published') return 'success';
  if (status === 'archived') return 'neutral';
  return 'accent';
}

export function AdminCategoriesView({
  profile,
  initialCategories,
  className,
}: AdminCategoriesViewProps) {
  const categoriesQuery = useAdminCategories(profile, initialCategories);
  const createMutation = useCreateAdminCategory();
  const updateMutation = useUpdateAdminCategory();
  const archiveMutation = useArchiveAdminCategory();

  const [formOpen, setFormOpen] = useState(false);
  const [formState, setFormState] = useState<CategoryFormState>(
    createInitialFormState,
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [conflictBanner, setConflictBanner] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [actionBanner, setActionBanner] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<AdminCategoryItem | null>(
    null,
  );
  const [archiveError, setArchiveError] = useState<string | null>(null);

  const items = categoriesQuery.data?.items ?? initialCategories.items;

  function openCreateDialog() {
    setFormState(createInitialFormState());
    setFormError(null);
    setConflictBanner(null);
    setFieldErrors({});
    setFormOpen(true);
  }

  function openEditDialog(category: AdminCategoryItem) {
    setFormState({
      mode: 'edit',
      id: category.id,
      name: category.name,
      slug: category.slug,
      slugTouched: true,
      parentId: category.parentId ?? '',
      description: category.description ?? '',
      sortOrder: String(category.sortOrder),
      status: category.status,
      expectedUpdatedAt: category.updatedAt,
    });
    setFormError(null);
    setConflictBanner(null);
    setFieldErrors({});
    setFormOpen(true);
  }

  function handleNameChange(nextName: string) {
    setFormState((prev) => ({
      ...prev,
      name: nextName,
      slug:
        prev.mode === 'create' && !prev.slugTouched
          ? slugifyCatalogName(nextName)
          : prev.slug,
    }));
  }

  async function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setConflictBanner(null);
    setFieldErrors({});
    setActionBanner(null);

    const parsedSortOrder = Number.parseInt(formState.sortOrder, 10);
    const parentId = formState.parentId.trim() || null;

    if (formState.mode === 'create') {
      const candidate = {
        name: formState.name,
        slug: formState.slug,
        parentId,
        description: formState.description || null,
        sortOrder: Number.isNaN(parsedSortOrder) ? -1 : parsedSortOrder,
        status: formState.status === 'published' ? 'published' : 'draft',
      };

      const parsed = createAdminCategorySchema.safeParse(candidate);
      if (!parsed.success) {
        const nextErrors: Record<string, string[]> = {};
        for (const issue of parsed.error.issues) {
          const key = issue.path.join('.') || 'root';
          nextErrors[key] = [...(nextErrors[key] ?? []), issue.message];
        }
        setFieldErrors(nextErrors);
        setFormError('Periksa isian kategori.');
        return;
      }

      try {
        await createMutation.mutateAsync(parsed.data);
        setFormOpen(false);
        setActionBanner({
          tone: 'success',
          message: `Kategori "${parsed.data.name}" berhasil dibuat.`,
        });
      } catch (err) {
        applyMutationError(err);
      }
      return;
    }

    if (!formState.id || !formState.expectedUpdatedAt) return;

    if (
      wouldCreateCategoryCycle(
        formState.id,
        parentId,
        items.map((item) => ({ id: item.id, parentId: item.parentId })),
      )
    ) {
      const cycleMsg = ADMIN_CATALOG_COPY.CATEGORIES.ERRORS.CYCLE;
      setFieldErrors({ parentId: [cycleMsg] });
      setFormError(cycleMsg);
      return;
    }

    const candidate = {
      name: formState.name,
      parentId,
      description: formState.description || null,
      sortOrder: Number.isNaN(parsedSortOrder) ? -1 : parsedSortOrder,
      status: formState.status,
      expectedUpdatedAt: formState.expectedUpdatedAt,
    };

    const parsed = updateAdminCategorySchema.safeParse(candidate);
    if (!parsed.success) {
      const nextErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.') || 'root';
        nextErrors[key] = [...(nextErrors[key] ?? []), issue.message];
      }
      setFieldErrors(nextErrors);
      setFormError('Periksa perubahan kategori.');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: formState.id,
        payload: parsed.data,
      });
      setFormOpen(false);
      setActionBanner({
        tone: 'success',
        message: `Kategori "${parsed.data.name}" berhasil diperbarui.`,
      });
    } catch (err) {
      applyMutationError(err);
    }
  }

  function applyMutationError(err: unknown) {
    if (err instanceof ApiClientError) {
      if (err.code === 'CONFLICT') {
        setConflictBanner(err.message);
      }
      setFormError(err.message);
      if (err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      }
      return;
    }
    setFormError('Terjadi kesalahan saat menyimpan kategori.');
  }

  async function handleQuickPublish(category: AdminCategoryItem) {
    setActionBanner(null);
    try {
      await updateMutation.mutateAsync({
        id: category.id,
        payload: {
          name: category.name,
          parentId: category.parentId,
          description: category.description,
          sortOrder: category.sortOrder,
          status: 'published',
          expectedUpdatedAt: category.updatedAt,
        },
      });
      setActionBanner({
        tone: 'success',
        message: `Kategori "${category.name}" sekarang terpublikasi.`,
      });
    } catch (err) {
      setActionBanner({
        tone: 'error',
        message:
          err instanceof ApiClientError
            ? err.message
            : 'Gagal mempublikasikan kategori.',
      });
    }
  }

  async function handleConfirmArchive() {
    if (!archiveTarget) return;
    setArchiveError(null);
    setActionBanner(null);
    try {
      await archiveMutation.mutateAsync({
        id: archiveTarget.id,
        payload: { expectedUpdatedAt: archiveTarget.updatedAt },
      });
      setActionBanner({
        tone: 'success',
        message: `Kategori "${archiveTarget.name}" telah diarsipkan.`,
      });
      setArchiveTarget(null);
    } catch (err) {
      setArchiveError(
        err instanceof ApiClientError
          ? err.message
          : 'Gagal mengarsipkan kategori.',
      );
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <section className={cn('admin-section', className)}>
      <div className="admin-section-header">
        <div>
          <h2 className="admin-section-title">
            {ADMIN_CATALOG_COPY.CATEGORIES.TITLE}
          </h2>
          <p className="admin-section-subtitle">
            {ADMIN_CATALOG_COPY.CATEGORIES.SUBTITLE}
          </p>
        </div>
        <div className="admin-inline-actions">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={categoriesQuery.isFetching}
            loadingLabel={ADMIN_CATALOG_COPY.CATEGORIES.REFRESH}
            onClick={() => {
              void categoriesQuery.refetch();
            }}
          >
            <RefreshCw size={16} aria-hidden="true" />
            <span>{ADMIN_CATALOG_COPY.CATEGORIES.REFRESH}</span>
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={openCreateDialog}
          >
            <Plus size={16} aria-hidden="true" />
            <span>{ADMIN_CATALOG_COPY.CATEGORIES.ADD_BUTTON}</span>
          </Button>
        </div>
      </div>

      {actionBanner ? (
        <Feedback
          tone={actionBanner.tone}
          title={actionBanner.message}
          announce
        />
      ) : null}

      {categoriesQuery.error instanceof ApiClientError ? (
        <Feedback tone="error" title={categoriesQuery.error.message} announce />
      ) : null}

      {items.length === 0 ? (
        <Card tone="cream" className="admin-empty-card">
          <p className="admin-section-subtitle">
            {ADMIN_CATALOG_COPY.CATEGORIES.EMPTY}
          </p>
        </Card>
      ) : (
        <div className="admin-list-stack">
          {items.map((category) => {
            const hasRefs =
              category.childCount > 0 || category.productRefCount > 0;
            return (
              <Card key={category.id} tone="surface" className="admin-row-card">
                <div className="admin-row-main">
                  <div className="admin-row-title-row">
                    <h3 className="admin-row-title admin-wrap-text">
                      {category.name}
                    </h3>
                    <Badge tone={getStatusBadgeTone(category.status)}>
                      {
                        ADMIN_CATALOG_COPY.CATEGORIES.STATUS_LABELS[
                          category.status
                        ]
                      }
                    </Badge>
                    <Badge tone="neutral">Urutan {category.sortOrder}</Badge>
                  </div>
                  <p className="admin-row-meta admin-wrap-text">
                    Slug: <code>{category.slug}</code>
                    {category.parentName
                      ? ` · ${ADMIN_CATALOG_COPY.CATEGORIES.PARENT_PREFIX} ${category.parentName}`
                      : ''}
                  </p>
                  {category.description ? (
                    <p className="admin-row-desc admin-wrap-text">
                      {category.description}
                    </p>
                  ) : null}
                  <p className="admin-row-meta">
                    {ADMIN_CATALOG_COPY.CATEGORIES.REFS_PREFIX}{' '}
                    {hasRefs
                      ? `${category.childCount} subkategori, ${category.productRefCount} produk`
                      : ADMIN_CATALOG_COPY.CATEGORIES.REFS_NONE}
                  </p>
                </div>

                <div className="admin-row-actions">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => openEditDialog(category)}
                  >
                    <Pencil size={15} aria-hidden="true" />
                    <span>{ADMIN_CATALOG_COPY.CATEGORIES.EDIT_BTN}</span>
                  </Button>
                  {category.status === 'draft' ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      loading={updateMutation.isPending}
                      onClick={() => {
                        void handleQuickPublish(category);
                      }}
                    >
                      <CheckCircle2 size={15} aria-hidden="true" />
                      <span>{ADMIN_CATALOG_COPY.CATEGORIES.PUBLISH_BTN}</span>
                    </Button>
                  ) : null}
                  {category.status !== 'archived' ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setArchiveError(null);
                        setArchiveTarget(category);
                      }}
                    >
                      <Archive size={15} aria-hidden="true" />
                      <span>{ADMIN_CATALOG_COPY.CATEGORIES.ARCHIVE_BTN}</span>
                    </Button>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={
          formState.mode === 'create'
            ? ADMIN_CATALOG_COPY.CATEGORIES.FORM_CREATE_TITLE
            : ADMIN_CATALOG_COPY.CATEGORIES.FORM_EDIT_TITLE
        }
      >
        <form onSubmit={handleFormSubmit} className="admin-modal-form">
          {conflictBanner ? (
            <Feedback tone="error" title={conflictBanner} announce>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={async () => {
                  const res = await categoriesQuery.refetch();
                  const latest = res.data?.items.find(
                    (cat) => cat.id === formState.id,
                  );
                  if (latest) {
                    openEditDialog(latest);
                  }
                }}
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
                onChange={(event) => handleNameChange(event.target.value)}
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
                  setFormState((prev) => ({
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
                  setFormState((prev) => ({
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
                    setFormState((prev) => ({
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
                    setFormState((prev) => ({
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
                  setFormState((prev) => ({
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
              onClick={() => setFormOpen(false)}
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

      <Dialog
        open={Boolean(archiveTarget)}
        onOpenChange={(open) => {
          if (!open) setArchiveTarget(null);
        }}
        title={ADMIN_CATALOG_COPY.CATEGORIES.ARCHIVE_CONFIRM_TITLE}
        description={ADMIN_CATALOG_COPY.CATEGORIES.ARCHIVE_CONFIRM_DESC}
      >
        <div className="admin-modal-form">
          {archiveTarget ? (
            <p className="admin-row-title admin-wrap-text">
              {archiveTarget.name} (<code>{archiveTarget.slug}</code>)
            </p>
          ) : null}
          {archiveError ? (
            <Feedback tone="error" title={archiveError} announce />
          ) : null}
          <div className="admin-modal-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setArchiveTarget(null)}
            >
              {ADMIN_CATALOG_COPY.CATEGORIES.CANCEL}
            </Button>
            <Button
              type="button"
              variant="primary"
              loading={archiveMutation.isPending}
              loadingLabel="Mengarsipkan..."
              onClick={() => {
                void handleConfirmArchive();
              }}
            >
              {ADMIN_CATALOG_COPY.CATEGORIES.ARCHIVE_CONFIRM_SUBMIT}
            </Button>
          </div>
        </div>
      </Dialog>
    </section>
  );
}
