'use client';

import {
  Archive,
  CheckCircle2,
  Edit3,
  HelpCircle,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { useMemo, useState } from 'react';

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
  useAdminFaqs,
  useArchiveAdminFaq,
  useCreateAdminFaq,
  useUpdateAdminFaq,
} from '@/hooks/use-admin-cms';
import { ApiClientError } from '@/lib/errors';
import type {
  AdminFaqItem,
  AdminFaqListResponse,
  AdminPublishingStatus,
} from '@/types/admin-cms';
import type { AdminSessionProfile } from '@/types/auth';
import { cn } from '@/utils';

interface AdminFaqsViewProps {
  profile: AdminSessionProfile;
  initialData?: AdminFaqListResponse;
  className?: string;
}

interface FaqFormState {
  id: string | null;
  expectedUpdatedAt: string | null;
  category: string;
  question: string;
  answer: string;
  sortOrder: string;
  status: AdminPublishingStatus;
}

const EMPTY_FORM: FaqFormState = {
  id: null,
  expectedUpdatedAt: null,
  category: 'Pemesanan',
  question: '',
  answer: '',
  sortOrder: '0',
  status: 'draft',
};

function faqToForm(item: AdminFaqItem): FaqFormState {
  return {
    id: item.id,
    expectedUpdatedAt: item.updatedAt,
    category: item.category,
    question: item.question,
    answer: item.answer,
    sortOrder: String(item.sortOrder),
    status: item.status,
  };
}

const STATUS_BADGE_MAP: Record<
  AdminPublishingStatus,
  { label: string; tone: 'neutral' | 'success' | 'accent' }
> = {
  draft: { label: 'Draf', tone: 'neutral' },
  published: { label: 'Terpublikasi', tone: 'success' },
  archived: { label: 'Diarsipkan', tone: 'accent' },
};

export function AdminFaqsView({
  profile,
  initialData,
  className,
}: AdminFaqsViewProps) {
  const faqsQuery = useAdminFaqs(profile, initialData);
  const createMutation = useCreateAdminFaq();
  const updateMutation = useUpdateAdminFaq();
  const archiveMutation = useArchiveAdminFaq();

  const [statusFilter, setStatusFilter] = useState<
    'all' | AdminPublishingStatus
  >('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState<FaqFormState>(EMPTY_FORM);
  const [archiveTarget, setArchiveTarget] = useState<AdminFaqItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const items = useMemo(() => faqsQuery.data?.items ?? [], [faqsQuery.data]);
  const visibleItems = useMemo(
    () =>
      items.filter((item) =>
        statusFilter === 'all' ? true : item.status === statusFilter,
      ),
    [items, statusFilter],
  );

  function openCreate() {
    setActionError(null);
    setFieldErrors({});
    setForm(EMPTY_FORM);
    setEditorOpen(true);
  }

  function openEdit(item: AdminFaqItem) {
    setActionError(null);
    setFieldErrors({});
    setForm(faqToForm(item));
    setEditorOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionError(null);
    setFieldErrors({});
    setSuccessMessage(null);

    const parsedSortOrder = Number.parseInt(form.sortOrder, 10);
    const sortOrder = Number.isFinite(parsedSortOrder) ? parsedSortOrder : 0;

    try {
      if (form.id && form.expectedUpdatedAt) {
        await updateMutation.mutateAsync({
          faqId: form.id,
          payload: {
            category: form.category.trim(),
            question: form.question.trim(),
            answer: form.answer.trim(),
            sortOrder,
            status: form.status,
            expectedUpdatedAt: form.expectedUpdatedAt,
          },
        });
        setSuccessMessage('FAQ berhasil diperbarui.');
      } else {
        await createMutation.mutateAsync({
          category: form.category.trim(),
          question: form.question.trim(),
          answer: form.answer.trim(),
          sortOrder,
          status: form.status,
        });
        setSuccessMessage('FAQ baru berhasil dibuat.');
      }
      setEditorOpen(false);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setActionError(err.message);
        if (err.fieldErrors) setFieldErrors(err.fieldErrors);
        return;
      }
      setActionError('Gagal menyimpan FAQ.');
    }
  }

  async function handleConfirmArchive() {
    if (!archiveTarget) return;
    setActionError(null);
    setSuccessMessage(null);
    try {
      await archiveMutation.mutateAsync({
        faqId: archiveTarget.id,
        payload: { expectedUpdatedAt: archiveTarget.updatedAt },
      });
      setArchiveTarget(null);
      setSuccessMessage(
        'FAQ berhasil diarsipkan dan disembunyikan dari publik.',
      );
    } catch (err) {
      setActionError(
        err instanceof ApiClientError ? err.message : 'Gagal mengarsipkan FAQ.',
      );
    }
  }

  function getError(field: string) {
    return fieldErrors[field]?.[0];
  }

  return (
    <section
      className={cn('admin-module-page', className)}
      aria-labelledby="admin-faqs-title"
    >
      <div className="admin-module-header">
        <div>
          <h2 id="admin-faqs-title" className="admin-section-title">
            {ADMIN_CATALOG_COPY.FAQS.TITLE}
          </h2>
          <p className="admin-section-subtitle">
            {ADMIN_CATALOG_COPY.FAQS.SUBTITLE}
          </p>
        </div>
        <div className="admin-inline-actions">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => void faqsQuery.refetch()}
            loading={faqsQuery.isFetching}
          >
            <RefreshCw size={16} aria-hidden="true" />
            {ADMIN_CATALOG_COPY.FAQS.REFRESH}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={openCreate}
          >
            <Plus size={16} aria-hidden="true" />
            {ADMIN_CATALOG_COPY.FAQS.ADD_BUTTON}
          </Button>
        </div>
      </div>

      {actionError ? (
        <Feedback tone="error" title={actionError} announce />
      ) : null}
      {successMessage ? (
        <Feedback tone="success" title={successMessage} announce />
      ) : null}

      <div className="admin-filter-row">
        <FormField id="faq-status-filter" label="Filter Status">
          {(fieldProps) => (
            <Select
              {...fieldProps}
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as 'all' | AdminPublishingStatus)
              }
            >
              <option value="all">Semua ({items.length})</option>
              <option value="published">Terpublikasi</option>
              <option value="draft">Draf</option>
              <option value="archived">Diarsipkan</option>
            </Select>
          )}
        </FormField>
      </div>

      {visibleItems.length === 0 ? (
        <Feedback title={ADMIN_CATALOG_COPY.FAQS.EMPTY} />
      ) : (
        <div className="admin-cards-grid">
          {visibleItems.map((item) => {
            const badge = STATUS_BADGE_MAP[item.status];
            return (
              <Card key={item.id} tone="surface" className="admin-entity-card">
                <div className="admin-card-head">
                  <div className="admin-inline-actions">
                    <Badge tone="neutral">{item.category}</Badge>
                    <Badge tone={badge.tone}>{badge.label}</Badge>
                    <Badge tone="neutral">Urutan {item.sortOrder}</Badge>
                  </div>
                </div>

                <h3 className="admin-card-title">
                  <HelpCircle
                    size={16}
                    aria-hidden="true"
                    className="mr-1 inline"
                  />
                  {item.question}
                </h3>
                <p className="admin-section-subtitle">{item.answer}</p>

                <div className="admin-inline-actions">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => openEdit(item)}
                  >
                    <Edit3 size={14} aria-hidden="true" />
                    Ubah
                  </Button>
                  {item.status === 'draft' ? (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={async () => {
                        setActionError(null);
                        try {
                          await updateMutation.mutateAsync({
                            faqId: item.id,
                            payload: {
                              category: item.category,
                              question: item.question,
                              answer: item.answer,
                              sortOrder: item.sortOrder,
                              status: 'published',
                              expectedUpdatedAt: item.updatedAt,
                            },
                          });
                          setSuccessMessage('FAQ berhasil dipublikasikan.');
                        } catch (err) {
                          setActionError(
                            err instanceof ApiClientError
                              ? err.message
                              : 'Gagal mempublikasikan FAQ.',
                          );
                        }
                      }}
                    >
                      <CheckCircle2 size={14} aria-hidden="true" />
                      Publikasikan
                    </Button>
                  ) : null}
                  {item.status !== 'archived' ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setArchiveTarget(item)}
                    >
                      <Archive size={14} aria-hidden="true" />
                      Arsipkan
                    </Button>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        title={form.id ? 'Ubah FAQ' : 'Tambah FAQ Baru'}
        description="Gunakan teks polos tanpa HTML. Hanya FAQ Terpublikasi yang muncul di halaman publik dan Asisten Ask Oma."
      >
        <form onSubmit={handleSubmit} className="admin-form-grid">
          <FormField
            id="faq-category"
            label="Kategori"
            error={getError('category')}
            required
          >
            {(fieldProps) => (
              <Input
                {...fieldProps}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            )}
          </FormField>

          <FormField
            id="faq-question"
            label="Pertanyaan"
            error={getError('question')}
            required
          >
            {(fieldProps) => (
              <Input
                {...fieldProps}
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
              />
            )}
          </FormField>

          <FormField
            id="faq-answer"
            label="Jawaban"
            error={getError('answer')}
            required
          >
            {(fieldProps) => (
              <Textarea
                {...fieldProps}
                rows={4}
                value={form.answer}
                onChange={(e) => setForm({ ...form, answer: e.target.value })}
              />
            )}
          </FormField>

          <div className="admin-form-grid admin-form-grid--two">
            <FormField
              id="faq-sort-order"
              label="Urutan Tampil"
              error={getError('sortOrder')}
            >
              {(fieldProps) => (
                <Input
                  {...fieldProps}
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm({ ...form, sortOrder: e.target.value })
                  }
                />
              )}
            </FormField>

            <FormField
              id="faq-status"
              label="Status"
              error={getError('status')}
            >
              {(fieldProps) => (
                <Select
                  {...fieldProps}
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as AdminPublishingStatus,
                    })
                  }
                >
                  <option value="draft">Draf</option>
                  <option value="published">Terpublikasi</option>
                  <option value="archived">Diarsipkan</option>
                </Select>
              )}
            </FormField>
          </div>

          <div className="admin-inline-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditorOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={createMutation.isPending || updateMutation.isPending}
              loadingLabel="Menyimpan..."
            >
              Simpan FAQ
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={Boolean(archiveTarget)}
        onOpenChange={(open) => {
          if (!open) setArchiveTarget(null);
        }}
        title={ADMIN_CATALOG_COPY.FAQS.ARCHIVE_CONFIRM_TITLE}
        description={ADMIN_CATALOG_COPY.FAQS.ARCHIVE_CONFIRM_DESC}
      >
        <div className="admin-inline-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setArchiveTarget(null)}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="primary"
            loading={archiveMutation.isPending}
            loadingLabel="Mengarsipkan..."
            onClick={() => void handleConfirmArchive()}
          >
            {ADMIN_CATALOG_COPY.FAQS.ARCHIVE_CONFIRM_SUBMIT}
          </Button>
        </div>
      </Dialog>
    </section>
  );
}
