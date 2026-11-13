'use client';

import {
  Archive,
  CheckCircle2,
  Edit3,
  MessageSquareQuote,
  Plus,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { WhatTheySaySection } from '@/components/home/what-they-say-section';
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
  useAdminTestimonials,
  useArchiveAdminTestimonial,
  useCreateAdminTestimonial,
  useUpdateAdminTestimonial,
} from '@/hooks/use-admin-cms';
import { ApiClientError } from '@/lib/errors';
import type {
  AdminPublishingStatus,
  AdminTestimonialItem,
  AdminTestimonialListResponse,
} from '@/types/admin-cms';
import type { AdminSessionProfile } from '@/types/auth';
import { cn } from '@/utils';

interface AdminTestimonialsViewProps {
  profile: AdminSessionProfile;
  initialData?: AdminTestimonialListResponse;
  className?: string;
}

interface TestimonialFormState {
  id: string | null;
  expectedUpdatedAt: string | null;
  displayName: string;
  quote: string;
  rating: string;
  sourceLabel: string;
  sourceUrl: string;
  consentAt: string;
  consentReference: string;
  sortOrder: string;
  status: AdminPublishingStatus;
}

const EMPTY_FORM: TestimonialFormState = {
  id: null,
  expectedUpdatedAt: null,
  displayName: 'Pelanggan Resep Oma',
  quote: '',
  rating: '',
  sourceLabel: 'Referensi historis — menunggu izin',
  sourceUrl: '',
  consentAt: '',
  consentReference: '',
  sortOrder: '0',
  status: 'draft',
};

function toDateInputValue(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function testimonialToForm(item: AdminTestimonialItem): TestimonialFormState {
  return {
    id: item.id,
    expectedUpdatedAt: item.updatedAt,
    displayName: item.displayName,
    quote: item.quote,
    rating: item.rating !== null ? String(item.rating) : '',
    sourceLabel: item.sourceLabel ?? '',
    sourceUrl: item.sourceUrl ?? '',
    consentAt: toDateInputValue(item.consentAt),
    consentReference: item.consentReference ?? '',
    sortOrder: String(item.sortOrder),
    status: item.status,
  };
}

export function AdminTestimonialsView({
  profile,
  initialData,
  className,
}: AdminTestimonialsViewProps) {
  const query = useAdminTestimonials(profile, initialData);
  const createMutation = useCreateAdminTestimonial();
  const updateMutation = useUpdateAdminTestimonial();
  const archiveMutation = useArchiveAdminTestimonial();

  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState<TestimonialFormState>(EMPTY_FORM);
  const [archiveTarget, setArchiveTarget] =
    useState<AdminTestimonialItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const items = useMemo(() => query.data?.items ?? [], [query.data]);
  const publishedConsented = useMemo(
    () =>
      items.filter(
        (item) =>
          item.status === 'published' &&
          Boolean(item.consentAt) &&
          Boolean(item.consentReference),
      ),
    [items],
  );

  function openCreate() {
    setActionError(null);
    setFieldErrors({});
    setForm(EMPTY_FORM);
    setEditorOpen(true);
  }

  function openEdit(item: AdminTestimonialItem) {
    setActionError(null);
    setFieldErrors({});
    setForm(testimonialToForm(item));
    setEditorOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionError(null);
    setFieldErrors({});
    setSuccessMessage(null);

    const parsedRating =
      form.rating.trim().length > 0 ? Number.parseInt(form.rating, 10) : null;
    const parsedSortOrder = Number.parseInt(form.sortOrder, 10);

    const payloadBase = {
      displayName: form.displayName.trim() || 'Pelanggan Resep Oma',
      quote: form.quote.trim(),
      rating:
        parsedRating !== null && Number.isFinite(parsedRating)
          ? parsedRating
          : null,
      sourceLabel: form.sourceLabel.trim() || null,
      sourceUrl: form.sourceUrl.trim() || null,
      consentAt: form.consentAt.trim()
        ? `${form.consentAt.trim()}T00:00:00.000Z`
        : null,
      consentReference: form.consentReference.trim() || null,
      sortOrder: Number.isFinite(parsedSortOrder) ? parsedSortOrder : 0,
      status: form.status,
    };

    try {
      if (form.id && form.expectedUpdatedAt) {
        await updateMutation.mutateAsync({
          testimonialId: form.id,
          payload: {
            ...payloadBase,
            expectedUpdatedAt: form.expectedUpdatedAt,
          },
        });
        setSuccessMessage('Testimoni berhasil diperbarui.');
      } else {
        await createMutation.mutateAsync(payloadBase);
        setSuccessMessage('Draf testimoni berhasil dibuat.');
      }
      setEditorOpen(false);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setActionError(err.message);
        if (err.fieldErrors) setFieldErrors(err.fieldErrors);
        return;
      }
      setActionError('Gagal menyimpan testimoni.');
    }
  }

  async function handleConfirmArchive() {
    if (!archiveTarget) return;
    setActionError(null);
    setSuccessMessage(null);
    try {
      await archiveMutation.mutateAsync({
        testimonialId: archiveTarget.id,
        payload: { expectedUpdatedAt: archiveTarget.updatedAt },
      });
      setArchiveTarget(null);
      setSuccessMessage('Testimoni berhasil diarsipkan.');
    } catch (err) {
      setActionError(
        err instanceof ApiClientError
          ? err.message
          : 'Gagal mengarsipkan testimoni.',
      );
    }
  }

  function getError(field: string) {
    return fieldErrors[field]?.[0];
  }

  return (
    <section
      className={cn('admin-module-page', className)}
      aria-labelledby="admin-testimonials-title"
    >
      <div className="admin-module-header">
        <div>
          <h2 id="admin-testimonials-title" className="admin-section-title">
            {ADMIN_CATALOG_COPY.TESTIMONIALS.TITLE}
          </h2>
          <p className="admin-section-subtitle">
            {ADMIN_CATALOG_COPY.TESTIMONIALS.SUBTITLE}
          </p>
        </div>
        <div className="admin-inline-actions">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => void query.refetch()}
            loading={query.isFetching}
          >
            <RefreshCw size={16} aria-hidden="true" />
            {ADMIN_CATALOG_COPY.TESTIMONIALS.REFRESH}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={openCreate}
          >
            <Plus size={16} aria-hidden="true" />
            {ADMIN_CATALOG_COPY.TESTIMONIALS.ADD_BUTTON}
          </Button>
        </div>
      </div>

      <Feedback
        tone="info"
        title={ADMIN_CATALOG_COPY.TESTIMONIALS.EVIDENCE_PRIVACY_NOTE}
      />

      {actionError ? (
        <Feedback tone="error" title={actionError} announce />
      ) : null}
      {successMessage ? (
        <Feedback tone="success" title={successMessage} announce />
      ) : null}

      <Card tone="cream" className="admin-subpanel">
        <div className="admin-card-head">
          <h3 className="admin-card-title">
            <ShieldCheck size={18} aria-hidden="true" className="mr-1 inline" />
            {ADMIN_CATALOG_COPY.TESTIMONIALS.PREVIEW_HEADING}
          </h3>
          <Badge tone={publishedConsented.length > 0 ? 'success' : 'neutral'}>
            {publishedConsented.length} Terpublikasi & Berizin
          </Badge>
        </div>
        {publishedConsented.length === 0 ? (
          <p className="admin-section-subtitle mb-3">
            {ADMIN_CATALOG_COPY.TESTIMONIALS.PREVIEW_PUBLIC_HIDDEN_NOTE}
          </p>
        ) : null}
        <WhatTheySaySection
          allowEmptyPreview
          testimonials={{
            status: 'success',
            data: publishedConsented.map((item) => ({
              id: item.id,
              displayName: item.displayName,
              quote: item.quote,
              rating: item.rating,
              sourceLabel: item.sourceLabel ?? 'Pelanggan Resep Oma Kueh',
            })),
          }}
        />
      </Card>

      {items.length === 0 ? (
        <Feedback title={ADMIN_CATALOG_COPY.TESTIMONIALS.EMPTY} />
      ) : (
        <div className="admin-cards-grid">
          {items.map((item) => {
            const hasConsent = Boolean(item.consentAt && item.consentReference);
            return (
              <Card key={item.id} tone="surface" className="admin-entity-card">
                <div className="admin-card-head">
                  <div className="admin-inline-actions">
                    <Badge
                      tone={
                        item.status === 'published'
                          ? 'success'
                          : item.status === 'archived'
                            ? 'accent'
                            : 'neutral'
                      }
                    >
                      {item.status === 'published'
                        ? 'Terpublikasi'
                        : item.status === 'archived'
                          ? 'Diarsipkan'
                          : 'Draf'}
                    </Badge>
                    <Badge tone={hasConsent ? 'success' : 'neutral'}>
                      {hasConsent ? 'Izin Tercatat' : 'Belum Ada Izin'}
                    </Badge>
                    {item.rating !== null ? (
                      <Badge tone="accent">{item.rating}/5</Badge>
                    ) : (
                      <Badge tone="neutral">Tanpa Rating</Badge>
                    )}
                  </div>
                </div>

                <h3 className="admin-card-title">
                  <MessageSquareQuote
                    size={16}
                    aria-hidden="true"
                    className="mr-1 inline"
                  />
                  {item.displayName}
                </h3>
                <blockquote className="home-testimonial-quote">
                  “{item.quote}”
                </blockquote>
                <p className="admin-section-subtitle">
                  Sumber: {item.sourceLabel ?? '—'}
                  {hasConsent
                    ? ` · Referensi Izin Privat (Owner): ${item.consentReference} (${toDateInputValue(item.consentAt)})`
                    : ''}
                </p>

                <div className="admin-inline-actions">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => openEdit(item)}
                  >
                    <Edit3 size={14} aria-hidden="true" />
                    Ubah & Catat Izin
                  </Button>
                  {item.status === 'draft' && hasConsent ? (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={async () => {
                        setActionError(null);
                        try {
                          await updateMutation.mutateAsync({
                            testimonialId: item.id,
                            payload: {
                              displayName: item.displayName,
                              quote: item.quote,
                              rating: item.rating,
                              sourceLabel: item.sourceLabel,
                              sourceUrl: item.sourceUrl,
                              consentAt: item.consentAt,
                              consentReference: item.consentReference,
                              sortOrder: item.sortOrder,
                              status: 'published',
                              expectedUpdatedAt: item.updatedAt,
                            },
                          });
                          setSuccessMessage(
                            'Testimoni berizin berhasil dipublikasikan.',
                          );
                        } catch (err) {
                          setActionError(
                            err instanceof ApiClientError
                              ? err.message
                              : 'Gagal mempublikasikan testimoni.',
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
        title={
          form.id ? 'Ubah Testimoni & Bukti Izin' : 'Tambah Draf Testimoni'
        }
        description="Simpan catatan izin tanpa mengunggah screenshot WhatsApp atau data pribadi pelanggan."
      >
        <form onSubmit={handleSubmit} className="admin-form-grid">
          <FormField
            id="testimonial-display-name"
            label="Nama Tampil Publik (Anonim by default)"
            error={getError('displayName')}
            required
          >
            {(fieldProps) => (
              <Input
                {...fieldProps}
                value={form.displayName}
                onChange={(e) =>
                  setForm({ ...form, displayName: e.target.value })
                }
              />
            )}
          </FormField>

          <FormField
            id="testimonial-quote"
            label="Kutipan Testimoni"
            error={getError('quote')}
            required
          >
            {(fieldProps) => (
              <Textarea
                {...fieldProps}
                rows={4}
                value={form.quote}
                onChange={(e) => setForm({ ...form, quote: e.target.value })}
              />
            )}
          </FormField>

          <div className="admin-form-grid admin-form-grid--two">
            <FormField
              id="testimonial-rating"
              label="Rating (1–5, opsional)"
              error={getError('rating')}
            >
              {(fieldProps) => (
                <Select
                  {...fieldProps}
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: e.target.value })}
                >
                  <option value="">Tanpa Rating</option>
                  <option value="5">5 / 5</option>
                  <option value="4">4 / 5</option>
                  <option value="3">3 / 5</option>
                  <option value="2">2 / 5</option>
                  <option value="1">1 / 5</option>
                </Select>
              )}
            </FormField>

            <FormField
              id="testimonial-status"
              label="Status Publikasi"
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
                  <option value="published">Terpublikasi (Wajib Izin)</option>
                  <option value="archived">Diarsipkan</option>
                </Select>
              )}
            </FormField>
          </div>

          <div className="admin-form-grid admin-form-grid--two">
            <FormField
              id="testimonial-source-label"
              label="Label Sumber"
              error={getError('sourceLabel')}
            >
              {(fieldProps) => (
                <Input
                  {...fieldProps}
                  value={form.sourceLabel}
                  onChange={(e) =>
                    setForm({ ...form, sourceLabel: e.target.value })
                  }
                />
              )}
            </FormField>

            <FormField
              id="testimonial-source-url"
              label="URL Sumber (HTTPS opsional)"
              error={getError('sourceUrl')}
            >
              {(fieldProps) => (
                <Input
                  {...fieldProps}
                  type="url"
                  placeholder="https://..."
                  value={form.sourceUrl}
                  onChange={(e) =>
                    setForm({ ...form, sourceUrl: e.target.value })
                  }
                />
              )}
            </FormField>
          </div>

          <div className="admin-form-grid admin-form-grid--two">
            <FormField
              id="testimonial-consent-at"
              label="Tanggal Persetujuan Privat (consent_at)"
              error={getError('consentAt')}
            >
              {(fieldProps) => (
                <Input
                  {...fieldProps}
                  type="date"
                  value={form.consentAt}
                  onChange={(e) =>
                    setForm({ ...form, consentAt: e.target.value })
                  }
                />
              )}
            </FormField>

            <FormField
              id="testimonial-consent-ref"
              label="Referensi Bukti Izin Privat (Non-PII)"
              helper="Contoh: Izin tertulis arsip internal #2026-11 (tanpa nomor HP/nama lengkap)."
              error={getError('consentReference')}
            >
              {(fieldProps) => (
                <Input
                  {...fieldProps}
                  value={form.consentReference}
                  onChange={(e) =>
                    setForm({ ...form, consentReference: e.target.value })
                  }
                />
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
              Simpan Testimoni
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={Boolean(archiveTarget)}
        onOpenChange={(open) => {
          if (!open) setArchiveTarget(null);
        }}
        title={ADMIN_CATALOG_COPY.TESTIMONIALS.ARCHIVE_CONFIRM_TITLE}
        description={ADMIN_CATALOG_COPY.TESTIMONIALS.ARCHIVE_CONFIRM_DESC}
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
            {ADMIN_CATALOG_COPY.TESTIMONIALS.ARCHIVE_CONFIRM_SUBMIT}
          </Button>
        </div>
      </Dialog>
    </section>
  );
}
